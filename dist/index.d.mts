declare function goTry<T>(value: PromiseLike<T>): Promise<readonly [undefined, Awaited<T>] | readonly [string, undefined]>;
declare function goTrySync<T>(value: () => T): readonly [string, undefined] | readonly [undefined, T];
declare function goTryRaw<E = unknown, T = unknown>(value: PromiseLike<T>): Promise<readonly [undefined, Awaited<T>] | readonly [E, undefined]>;
declare function goTryRawSync<E = unknown, T = unknown>(value: () => T): readonly [undefined, T] | readonly [E, undefined];

export { goTry, goTryRaw, goTryRawSync, goTrySync };
