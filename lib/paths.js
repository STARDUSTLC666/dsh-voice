/**
 * 输出路径与音频文件校验。
 *
 * @module dsh-voice/paths
 */
import { existsSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
/** 校验音频文件存在且是文件；返回绝对路径。 */
export function assertAudioFile(input) {
    const absolute = resolve(input);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
        throw new Error('音频文件不存在：' + input);
    }
    return absolute;
}
/** 决定输出路径：缺省放在当前工作目录，同名自动加 _1/_2 序号。 */
export function resolveOutputPath(explicit, defaultName, overwrite) {
    let target = explicit !== undefined && explicit.trim() !== '' ? resolve(explicit.trim()) : resolve(process.cwd(), defaultName);
    if (overwrite || !existsSync(target))
        return target;
    const directory = dirname(target);
    const base = basename(target, extname(target));
    const extension = extname(target);
    for (let index = 1; index < 1000; index++) {
        const candidate = join(directory, base + '_' + index + extension);
        if (!existsSync(candidate))
            return candidate;
    }
    throw new Error('找不到可用的输出文件名（同名文件超过 999 个），请显式指定 output。');
}
