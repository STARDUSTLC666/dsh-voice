/**
 * 校验音频文件：必须存在于会话工作区内，且是普通文件。
 *
 * 相对路径按 cwd（会话工作区）解析，返回解析后的绝对路径；符号链接会先
 * 解析真实路径再判断边界，避免把工作区外的隐私文件（如 id_ed25519）当成
 * 音频整份上传给 ASR 服务。
 */
export declare function assertAudioFile(input: string, cwd?: string): string;
/**
 * 决定输出路径：缺省放在会话工作目录（缺省回退宿主 cwd），同名自动加 _1/_2 序号。
 *
 * 目标必须落在会话工作区内；已存在的符号链接直接拒绝，避免顺着悬空链接
 * 在工作区外创建文件。overwrite=false 时跳过已存在的路径（含符号链接）。
 */
export declare function resolveOutputPath(explicit: string | undefined, defaultName: string, overwrite: boolean, cwd?: string): string;
/** 确保输出目录存在且落在工作区内：不存在则创建，越界或符号链接报错。 */
export declare function ensureWorkspaceDirectory(input: string, cwd?: string): string;
/**
 * 写工作区内的文件，返回实际写入的路径。同名竞争通过 wx 排他创建解决。
 *
 * 新建时用 O_EXCL，避免检查完成到写入之间被人塞进一个符号链接。
 */
export declare function writeWorkspaceFile(target: string, data: string | Buffer, cwd?: string, mode?: number, overwrite?: boolean): string;
