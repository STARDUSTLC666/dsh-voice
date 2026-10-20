/**
 * 输出路径、音频文件与工作区边界校验。
 *
 * @module dsh-voice/paths
 */
import { lstatSync, mkdirSync, openSync, closeSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
/** 会话工作区的真实路径（解析符号链接）；取不到就退回解析后的绝对路径。 */
function workspaceRoot(cwd) {
    const absolute = resolve(cwd);
    try {
        return realpathSync(absolute);
    }
    catch {
        return absolute;
    }
}
/** candidate 是否等于 root 或位于 root 之下。 */
function isInside(root, candidate) {
    const rel = relative(root, candidate);
    return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep));
}
function pathState(target) {
    try {
        return lstatSync(target).isSymbolicLink() ? 'symlink' : 'present';
    }
    catch {
        return 'missing';
    }
}
/**
 * 沿着最近的已存在祖先解析真实路径，再接回尚不存在的后缀。
 *
 * 用于输出路径：目标文件通常还不存在，但仍要判断它落盘时会不会被
 * 中间某一层符号链接带到工作区之外。
 */
function resolveThroughExistingAncestor(target) {
    let current = target;
    const missing = [];
    for (;;) {
        try {
            const real = realpathSync(current);
            return missing.length === 0 ? real : join(real, ...missing.slice().reverse());
        }
        catch {
            const parent = dirname(current);
            if (parent === current)
                return target;
            missing.push(basename(current));
            current = parent;
        }
    }
}
/** 输出路径必须落在工作区内，且不能是符号链接（含悬空链接）。 */
function assertWritableTarget(target, root, label) {
    if (pathState(target) === 'symlink') {
        throw new Error(label + ' 是符号链接，拒绝写入：' + target + '（请改用工作区内的普通文件路径）');
    }
    const real = resolveThroughExistingAncestor(target);
    if (!isInside(root, real)) {
        throw new Error(label + ' 超出会话工作区：' + target + '（实际解析到 ' + real + '）。请把输出放在会话工作目录内。');
    }
}
/**
 * 校验音频文件：必须存在于会话工作区内，且是普通文件。
 *
 * 相对路径按 cwd（会话工作区）解析，返回解析后的绝对路径；符号链接会先
 * 解析真实路径再判断边界，避免把工作区外的隐私文件（如 id_ed25519）当成
 * 音频整份上传给 ASR 服务。
 */
export function assertAudioFile(input, cwd = process.cwd()) {
    const root = workspaceRoot(cwd);
    const requested = resolve(root, input);
    let real;
    try {
        real = realpathSync(requested);
    }
    catch {
        throw new Error('音频文件不存在：' + input);
    }
    if (!isInside(root, real)) {
        throw new Error('音频文件必须位于会话工作区内：' + input + '（实际解析到 ' + real + '）。请先复制到工作目录再转写。');
    }
    if (!statSync(real).isFile())
        throw new Error('音频文件不是普通文件：' + input);
    return requested;
}
/**
 * 决定输出路径：缺省放在会话工作目录（缺省回退宿主 cwd），同名自动加 _1/_2 序号。
 *
 * 目标必须落在会话工作区内；已存在的符号链接直接拒绝，避免顺着悬空链接
 * 在工作区外创建文件。overwrite=false 时跳过已存在的路径（含符号链接）。
 */
export function resolveOutputPath(explicit, defaultName, overwrite, cwd = process.cwd()) {
    const root = workspaceRoot(cwd);
    const requested = explicit !== undefined && explicit.trim() !== '' ? explicit.trim() : defaultName;
    const target = resolve(root, requested);
    assertWritableTarget(target, root, '输出路径');
    if (overwrite || pathState(target) === 'missing')
        return target;
    const directory = dirname(target);
    const base = basename(target, extname(target));
    const extension = extname(target);
    for (let index = 1; index < 1000; index++) {
        const candidate = join(directory, base + '_' + index + extension);
        if (pathState(candidate) !== 'missing')
            continue;
        assertWritableTarget(candidate, root, '输出路径');
        return candidate;
    }
    throw new Error('找不到可用的输出文件名（同名文件超过 999 个），请显式指定 output。');
}
/** 确保输出目录存在且落在工作区内：不存在则创建，越界或符号链接报错。 */
export function ensureWorkspaceDirectory(input, cwd = process.cwd()) {
    const root = workspaceRoot(cwd);
    const target = resolve(root, input);
    if (pathState(target) === 'symlink') {
        throw new Error('输出目录是符号链接，拒绝写入：' + target);
    }
    const real = resolveThroughExistingAncestor(target);
    if (!isInside(root, real)) {
        throw new Error('输出目录超出会话工作区：' + target + '（实际解析到 ' + real + '）。请把输出放在会话工作目录内。');
    }
    mkdirSync(target, { recursive: true });
    const after = realpathSync(target);
    if (!isInside(root, after)) {
        throw new Error('输出目录超出会话工作区：' + target + '（实际解析到 ' + after + '）');
    }
    return target;
}
/**
 * 写工作区内的文件：先建父目录，再按「新建用 wx / 覆盖用 w」落盘。
 *
 * 新建时用 O_EXCL，避免检查完成到写入之间被人塞进一个符号链接。
 */
export function writeWorkspaceFile(target, data, cwd = process.cwd(), mode) {
    const root = workspaceRoot(cwd);
    assertWritableTarget(target, root, '输出路径');
    mkdirSync(dirname(target), { recursive: true });
    assertWritableTarget(target, root, '输出路径');
    if (pathState(target) === 'missing') {
        const fd = openSync(target, 'wx', mode);
        try {
            writeFileSync(fd, data);
        }
        finally {
            closeSync(fd);
        }
        return;
    }
    writeFileSync(target, data, mode === undefined ? undefined : { mode });
}
