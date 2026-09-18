/** 校验音频文件存在且是文件；相对路径按 cwd（会话工作区）解析，返回绝对路径。 */
export declare function assertAudioFile(input: string, cwd?: string): string;
/** 决定输出路径：缺省放在会话工作目录（缺省回退宿主 cwd），同名自动加 _1/_2 序号。 */
export declare function resolveOutputPath(explicit: string | undefined, defaultName: string, overwrite: boolean, cwd?: string): string;
