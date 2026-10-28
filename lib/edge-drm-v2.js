/**
 * SPDX-License-Identifier: LGPL-3.0-only
 * Adapted from rany2/edge-tts 7.3.1 src/edge_tts/drm.py (rany and contributors).
 * https://github.com/rany2/edge-tts/blob/7.3.1/src/edge_tts/drm.py
 * TypeScript adaptation, 2026 STARDUSTLC666. See LICENSES/edge-tts-LGPLv3.txt.
 * Kept as a separate, replaceable module; the rest of dsh-voice remains MIT.
 */
const INITIAL = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const STATE = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const SCHEDULE = [0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564];
const K = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];
const COEFFICIENTS = [
    [0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF],
    [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C], [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB],
    [0x06064CF3, 0xFA51A3DA], [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61],
    [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167],
];
const rol16 = (x) => ((x << 16) | (x >>> 16)) >>> 0;
const rotr = (x, n) => (x >>> n) | (x << (32 - n));
const sigma0 = (x) => (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
const sigma1 = (x) => (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
const mul = (x, y) => Math.imul(x, y) >>> 0;
function expand(words, first = 16) {
    for (let i = first; i < 64; i++)
        words.push((sigma1(words[i - 2]) + words[i - 7] + sigma0(words[i - 15]) + words[i - 16]) >>> 0);
}
function rounds(state, words, first = 0) {
    let [a, b, c, d, e, f, g, h] = state;
    for (let i = first; i < 64; i++) {
        const constant = first === 14 && i === 14 ? 0xC9DC06A7 : K[i];
        const t1 = (h + ((rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0) + ((g ^ (e & (f ^ g))) >>> 0) + constant + words[i]) >>> 0;
        const t2 = (((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0) + (((a & b) | (c & (a | b))) >>> 0)) >>> 0;
        [a, b, c, d, e, f, g, h] = [(t1 + t2) >>> 0, a, b, c, (d + t1) >>> 0, e, f, g];
    }
    return [a, b, c, d, e, f, g, h];
}
function tokenDigest(data) {
    const words = new Array(14).fill(0);
    words.push(data.readUIntBE(0, 3), data.readUInt32BE(3));
    for (let i = 16; i < 30; i++) {
        let value = SCHEDULE[i - 16];
        if (i - 2 >= 14)
            value += (sigma1(words[i - 2]) ^ (i === 16 ? 0x000B92C0 : 0)) >>> 0;
        if (i - 7 >= 14)
            value += words[i - 7];
        if (i - 15 >= 14)
            value += (sigma0(words[i - 15]) ^ (i === 29 ? 0x059C0B80 : 0)) >>> 0;
        words.push(value >>> 0);
    }
    words.push((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + 0xC9DC06A7 - K[14]) >>> 0);
    expand(words, 31);
    let state = rounds(STATE, words, 14).map((x, i) => (x + INITIAL[i]) >>> 0);
    const length = 57 + data.length, padding = ((55 - length) % 64 + 64) % 64;
    const tail = Buffer.concat([data.subarray(7), Buffer.from([0x80]), Buffer.alloc(padding + 8)]);
    tail.writeBigUInt64BE(BigInt(length) * 8n, tail.length - 8);
    for (let offset = 0; offset < tail.length; offset += 64) {
        const block = Array.from({ length: 16 }, (_, i) => tail.readUInt32BE(offset + 4 * i));
        expand(block);
        state = rounds(state, block).map((x, i) => (x + state[i]) >>> 0);
    }
    const out = Buffer.alloc(32);
    state.forEach((x, i) => out.writeUInt32BE(x, 4 * i));
    return out;
}
function cs64(data, digest) {
    const keyA = (digest.readUInt32LE(0) | 1) >>> 0, keyB = (digest.readUInt32LE(4) | 1) >>> 0;
    const factors = [mul(keyA, 0x82893933), mul(keyB, 0x82893933)];
    const terms = COEFFICIENTS.map(([coefficient], i) => mul(coefficient, factors[i % 2])), offsets = COEFFICIENTS.map(([, offset]) => offset);
    const padded = Buffer.alloc(Math.ceil((data.length + 1) / 8) * 8);
    data.copy(padded, 1);
    for (let i = 0; i < padded.length / 4; i++) {
        const word = padded.readUInt32LE(4 * i);
        let term = mul(word, i % 2 === 0 ? keyA : keyB), offset = mul(rol16(word), i % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
        if (i === 0) {
            term = (term + mul(0xF2F90B1A, factors[0])) >>> 0;
            offset = (offset + 0x0B1A0000) >>> 0;
        }
        terms.push(term);
        offsets.push(offset);
    }
    let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
    for (let i = 0; i < terms.length; i += 2) {
        const x = terms[i], y = terms[i + 1];
        let t = rol16((offsets[i] + x) >>> 0), q = mul(t, 0x76F50F34);
        swapAcc += (mul(rol16(q), 0xC3EFEA97) + q) >>> 0;
        t = rol16((offsets[i + 1] + y) >>> 0);
        q = mul(t, 0x1881CE3C);
        swapLast = (mul(rol16(q), 0x35BD1EC9) + q) >>> 0;
        swapAcc = (swapAcc + swapLast) >>> 0;
        state = (mul(state, keyA) + x) >>> 0;
        for (const factor of [0xCF98B111, 0x87085B9F, 0x12CEB96D, 0x257E1D83])
            state = mul(rol16(state), factor);
        acc += state;
        t = (mul(state, keyB) + y) >>> 0;
        for (const factor of [0xA27416F5, 0xD38396FF])
            t = mul(rol16(t), factor);
        state = mul(rol16(mul(rol16(t), 0x7C932B89)), 0xBFA49F69);
        acc = (acc + state) >>> 0;
    }
    const out = Buffer.alloc(8);
    out.writeUInt32LE((swapLast ^ state) >>> 0);
    out.writeUInt32LE((swapAcc ^ acc) >>> 0, 4);
    return out;
}
let lastData = '', lastToken = '';
export function edgeTokenV2(data) {
    if (data === lastData)
        return lastToken;
    const bytes = Buffer.from(data, 'ascii'), digest = tokenDigest(bytes);
    lastToken = cs64(bytes, digest).toString('hex').toUpperCase() + '-' + digest.toString('hex').toUpperCase();
    lastData = data;
    return lastToken;
}
