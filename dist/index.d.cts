type ResultTuple<T> = readonly [undefined, T] | readonly [string, undefined];
type RawResultTuple<T, E = unknown> = readonly [undefined, T] | readonly [E, undefined];
declare function goTry<T>(value: PromiseLike<T>): PromiseLike<ResultTuple<T>>;
declare function goTry<T>(value: () => T): ResultTuple<T>;
declare function goTryRaw<T, E = unknown>(value: PromiseLike<T>): PromiseLike<RawResultTuple<T, E>>;
declare function goTryRaw<T, E = unknown>(value: () => T): RawResultTuple<T, E>;
declare function goExpect<T>(value: (() => T) | PromiseLike<T>, error?: (err: string) => string): Promise<T>;

export { goExpect, goTry, goTryRaw };
