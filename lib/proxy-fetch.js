/**
 * 插件级代理支持（HTTP(S) + 零依赖 SOCKS5 / SOCKS5H）：
 * - createProxyFetch：给 TTS 令牌、OpenAI TTS 与 ASR 请求提供走代理的 fetch（附带 undici FormData）；
 * - getProxyWsAgent：给 edge-tts WebSocket 提供按 proxyUrl 复用的代理 Agent。
 */
import * as https from 'node:https';
import * as net from 'node:net';
import * as tls from 'node:tls';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Agent, FormData as UndiciFormData, ProxyAgent, fetch as undiciFetch } from 'undici';
const wsAgentCache = new Map();
const SOCKS5_ERRORS = {
    0x01: '一般性 SOCKS 服务器故障',
    0x02: '规则集不允许连接',
    0x03: '网络不可达',
    0x04: '主机不可达',
    0x05: '目标拒绝连接',
    0x06: 'TTL 已过期',
    0x07: '不支持的 SOCKS 命令',
    0x08: '不支持的地址类型',
};
function stripBrackets(host) {
    return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}
function ipv6ToBuffer(ip) {
    const noZone = ip.split('%')[0];
    const halves = noZone.split('::');
    if (halves.length > 2)
        throw new Error('非法的 IPv6 地址：' + ip);
    const parseSide = (part) => {
        if (part === '')
            return [];
        const tokens = part.split(':');
        const words = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (i === tokens.length - 1 && token.includes('.')) {
                const octets = token.split('.').map(Number);
                if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
                    throw new Error('非法的 IPv4 映射 IPv6 地址：' + ip);
                }
                words.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
            }
            else {
                const val = parseInt(token, 16);
                if (!Number.isInteger(val) || val < 0 || val > 0xffff) {
                    throw new Error('非法的 IPv6 地址段：' + ip);
                }
                words.push(val);
            }
        }
        return words;
    };
    const left = parseSide(halves[0]);
    const right = halves.length === 2 ? parseSide(halves[1]) : [];
    const missing = 8 - left.length - right.length;
    if ((halves.length === 1 && missing !== 0) || missing < 0) {
        throw new Error('非法的 IPv6 地址长度：' + ip);
    }
    const words = [...left, ...new Array(missing).fill(0), ...right];
    const buf = Buffer.alloc(16);
    for (let i = 0; i < 8; i++)
        buf.writeUInt16BE(words[i], i * 2);
    return buf;
}
/**
 * 通过 RFC 1928 / RFC 1929 SOCKS5 协议建立到目标 host:port 的 TCP 隧道。
 */
export async function connectSocks5Tunnel(proxyUrl, targetHost, targetPort, useRemoteDns, signal) {
    if (signal?.aborted)
        throw signal.reason;
    if (!Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) {
        throw new Error('目标端口不合法：' + String(targetPort));
    }
    const proxyHost = stripBrackets(proxyUrl.hostname);
    const proxyPort = proxyUrl.port ? Number(proxyUrl.port) : 1080;
    if (!proxyHost || !Number.isInteger(proxyPort) || proxyPort < 1 || proxyPort > 65535) {
        throw new Error('SOCKS5 代理地址不合法：' + proxyUrl.href);
    }
    const hasAuth = proxyUrl.username !== '' || proxyUrl.password !== '';
    const username = decodeURIComponent(proxyUrl.username);
    const password = decodeURIComponent(proxyUrl.password);
    return new Promise((resolve, reject) => {
        const socket = net.connect({ host: proxyHost, port: proxyPort });
        let settled = false;
        let buffered = [];
        let bufferedBytes = 0;
        let pendingRead = null;
        const cleanupListeners = () => {
            socket.removeListener('data', onData);
            socket.removeListener('error', onError);
            socket.removeListener('close', onClose);
            signal?.removeEventListener('abort', onAbort);
        };
        const fail = (err) => {
            if (settled)
                return;
            settled = true;
            cleanupListeners();
            const error = err instanceof Error ? err : new Error(String(err));
            if (pendingRead) {
                const pr = pendingRead;
                pendingRead = null;
                pr.reject(error);
            }
            socket.destroy();
            reject(error);
        };
        const onAbort = () => fail(signal?.reason ?? new Error('SOCKS5 连接已取消'));
        const onError = (err) => fail(err);
        const onClose = () => fail(new Error('SOCKS5 代理在握手完成前断开连接'));
        const tryFlushRead = () => {
            if (!pendingRead || bufferedBytes < pendingRead.needed)
                return;
            const { needed, resolve: res } = pendingRead;
            pendingRead = null;
            const full = buffered.length === 1 ? buffered[0] : Buffer.concat(buffered);
            const head = full.subarray(0, needed);
            const tail = full.subarray(needed);
            buffered = tail.length > 0 ? [tail] : [];
            bufferedBytes = tail.length;
            res(head);
        };
        const onData = (chunk) => {
            buffered.push(chunk);
            bufferedBytes += chunk.length;
            tryFlushRead();
        };
        const readBytes = (needed) => {
            if (settled)
                return Promise.reject(new Error('SOCKS5 连接已关闭'));
            if (bufferedBytes >= needed) {
                return new Promise((res) => {
                    pendingRead = { needed, resolve: res, reject: () => { } };
                    tryFlushRead();
                });
            }
            return new Promise((res, rej) => {
                pendingRead = { needed, resolve: res, reject: rej };
            });
        };
        socket.on('data', onData);
        socket.on('error', onError);
        socket.on('close', onClose);
        if (signal)
            signal.addEventListener('abort', onAbort, { once: true });
        socket.once('connect', () => {
            void (async () => {
                // 1. 认证方法协商（RFC 1928 §3）
                socket.write(hasAuth ? Buffer.from([0x05, 0x02, 0x00, 0x02]) : Buffer.from([0x05, 0x01, 0x00]));
                const methodReply = await readBytes(2);
                if (methodReply[0] !== 0x05)
                    throw new Error('SOCKS5 代理响应版本不合法：' + methodReply[0]);
                const method = methodReply[1];
                if (method === 0xff)
                    throw new Error('SOCKS5 代理没有可接受的认证方式');
                if (method === 0x02) {
                    if (!hasAuth)
                        throw new Error('SOCKS5 代理要求用户名和密码认证');
                    const userBuf = Buffer.from(username, 'utf8');
                    const passBuf = Buffer.from(password, 'utf8');
                    if (userBuf.length > 255 || passBuf.length > 255) {
                        throw new Error('SOCKS5 用户名或密码过长（超过 255 字节）');
                    }
                    socket.write(Buffer.concat([Buffer.from([0x01, userBuf.length]), userBuf, Buffer.from([passBuf.length]), passBuf]));
                    const authReply = await readBytes(2);
                    if (authReply[1] !== 0x00)
                        throw new Error('SOCKS5 代理用户名或密码认证失败');
                }
                else if (method !== 0x00) {
                    throw new Error('不支持的 SOCKS5 认证方式：' + method);
                }
                // 2. CONNECT 请求（RFC 1928 §4）
                const cleanHost = stripBrackets(targetHost);
                const ipType = net.isIP(cleanHost);
                let atyp;
                let addrBuf;
                if (ipType === 4) {
                    atyp = 0x01;
                    addrBuf = Buffer.from(cleanHost.split('.').map(Number));
                }
                else if (ipType === 6) {
                    atyp = 0x04;
                    addrBuf = ipv6ToBuffer(cleanHost);
                }
                else {
                    // socks5h:// 与 socks5:// 对域名均使用 ATYP 0x03（域名由代理端解析）
                    void useRemoteDns;
                    const hostBuf = Buffer.from(cleanHost, 'utf8');
                    if (hostBuf.length === 0 || hostBuf.length > 255) {
                        throw new Error('SOCKS5 目标主机名不合法：' + targetHost);
                    }
                    atyp = 0x03;
                    addrBuf = Buffer.concat([Buffer.from([hostBuf.length]), hostBuf]);
                }
                const portBuf = Buffer.alloc(2);
                portBuf.writeUInt16BE(targetPort, 0);
                socket.write(Buffer.concat([Buffer.from([0x05, 0x01, 0x00, atyp]), addrBuf, portBuf]));
                // 3. 解析 CONNECT 响应
                const header = await readBytes(4);
                if (header[0] !== 0x05)
                    throw new Error('SOCKS5 CONNECT 响应版本不合法：' + header[0]);
                if (header[1] !== 0x00) {
                    throw new Error('SOCKS5 连接失败：' + (SOCKS5_ERRORS[header[1]] ?? '错误码 0x' + header[1].toString(16)));
                }
                const bndAtyp = header[3];
                if (bndAtyp === 0x01) {
                    await readBytes(6);
                }
                else if (bndAtyp === 0x04) {
                    await readBytes(18);
                }
                else if (bndAtyp === 0x03) {
                    const lenBuf = await readBytes(1);
                    await readBytes(lenBuf[0] + 2);
                }
                else {
                    throw new Error('SOCKS5 响应地址类型不合法：' + bndAtyp);
                }
                if (settled)
                    return;
                settled = true;
                cleanupListeners();
                if (bufferedBytes > 0) {
                    const leftover = buffered.length === 1 ? buffered[0] : Buffer.concat(buffered);
                    buffered = [];
                    bufferedBytes = 0;
                    socket.unshift(leftover);
                }
                resolve(socket);
            })().catch(fail);
        });
    });
}
class Socks5WsAgent extends https.Agent {
    proxyUrl;
    useRemoteDns;
    constructor(proxyUrl, useRemoteDns) {
        super({ keepAlive: false });
        this.proxyUrl = proxyUrl;
        this.useRemoteDns = useRemoteDns;
    }
    createConnection(options, callback) {
        const targetHost = options.hostname || options.host || '';
        const isSecure = options.protocol ? options.protocol === 'https:' : true;
        const targetPort = Number(options.port || (isSecure ? 443 : 80));
        connectSocks5Tunnel(this.proxyUrl, targetHost, targetPort, this.useRemoteDns)
            .then((rawSocket) => {
            if (isSecure) {
                const cleanHost = stripBrackets(targetHost);
                const servername = options.servername || (!net.isIP(cleanHost) ? cleanHost : undefined);
                const tlsSocket = tls.connect({
                    socket: rawSocket,
                    ...(servername ? { servername } : {}),
                    ...(options.rejectUnauthorized !== undefined ? { rejectUnauthorized: options.rejectUnauthorized } : {}),
                });
                callback?.(null, tlsSocket);
            }
            else {
                callback?.(null, rawSocket);
            }
        })
            .catch((error) => {
            callback?.(error instanceof Error ? error : new Error(String(error)), undefined);
        });
        return undefined;
    }
}
export function createProxyFetch(proxyUrl) {
    const parsed = new URL(proxyUrl);
    const isSocks5 = parsed.protocol === 'socks5:' || parsed.protocol === 'socks5h:';
    const dispatcher = isSocks5
        ? new Agent({
            connect(opts, cb) {
                const useRemoteDns = parsed.protocol === 'socks5h:';
                const targetPort = Number(opts.port || (opts.protocol === 'https:' ? 443 : 80));
                const signal = opts.signal;
                connectSocks5Tunnel(parsed, opts.hostname, targetPort, useRemoteDns, signal)
                    .then((rawSocket) => {
                    if (opts.protocol === 'https:') {
                        const cleanHost = stripBrackets(opts.servername || opts.hostname);
                        const servername = net.isIP(cleanHost) ? undefined : cleanHost;
                        const tlsSocket = tls.connect({
                            socket: rawSocket,
                            ...(servername ? { servername } : {}),
                        });
                        let settled = false;
                        const cleanup = () => {
                            tlsSocket.removeListener('secureConnect', onSecureConnect);
                            tlsSocket.removeListener('error', onError);
                            signal?.removeEventListener('abort', onAbort);
                        };
                        const onSecureConnect = () => {
                            if (settled)
                                return;
                            settled = true;
                            cleanup();
                            cb(null, tlsSocket);
                        };
                        const onError = (err) => {
                            if (settled)
                                return;
                            settled = true;
                            cleanup();
                            tlsSocket.destroy();
                            cb(err, null);
                        };
                        const onAbort = () => {
                            if (settled)
                                return;
                            settled = true;
                            cleanup();
                            const reason = signal?.reason;
                            const err = reason instanceof Error ? reason : new Error(String(reason ?? 'SOCKS5 TLS handshake aborted'));
                            tlsSocket.destroy(err);
                            cb(err, null);
                        };
                        if (signal?.aborted) {
                            onAbort();
                            return;
                        }
                        tlsSocket.once('secureConnect', onSecureConnect);
                        tlsSocket.once('error', onError);
                        signal?.addEventListener('abort', onAbort, { once: true });
                    }
                    else {
                        cb(null, rawSocket);
                    }
                })
                    .catch((error) => {
                    cb(error instanceof Error ? error : new Error(String(error)), null);
                });
            },
        })
        : new ProxyAgent(proxyUrl);
    const impl = ((input, init) => undiciFetch(input, { ...init, dispatcher }));
    impl.FormData = UndiciFormData;
    return impl;
}
export function getProxyWsAgent(proxyUrl) {
    const cached = wsAgentCache.get(proxyUrl);
    if (cached !== undefined)
        return cached;
    const parsed = new URL(proxyUrl);
    const agent = parsed.protocol === 'socks5:' || parsed.protocol === 'socks5h:'
        ? new Socks5WsAgent(parsed, parsed.protocol === 'socks5h:')
        : new HttpsProxyAgent(proxyUrl);
    wsAgentCache.set(proxyUrl, agent);
    return agent;
}
