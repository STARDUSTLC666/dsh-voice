/** 校验音频文件存在且是文件；返回绝对路径。 */
export declare function assertAudioFile(input: string): string;
/** 决定输出路径：缺省放在当前工作目录，同名自动加 _1/_2 序号。 */
export declare function resolveOutputPath(explicit: string | undefined, defaultName: string, overwrite: boolean): string;
