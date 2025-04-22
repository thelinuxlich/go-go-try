type Success<T> = readonly [undefined, T];
type Failure<E> = readonly [E, undefined];
type Result<E, T> = Success<T> | Failure<E>;
type MaybePromise<T> = T | Promise<T>;
declare function isSuccess<E, T>(result: Result<E, T>): result is Success<T>;
declare function isFailure<E, T>(result: Result<E, T>): result is Failure<E>;
declare function success<T>(value: T): Success<T>;
declare function failure<E>(error: E): Failure<E>;
declare function goTry<T>(promise: Promise<T>): Promise<Result<string, T>>;
declare function goTry<T>(fn: () => T): Result<string, T>;
declare function goTry<T>(value: T): Result<string, T>;
declare function goTryRaw<T, E = Error>(promise: Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>;
declare function goTryRaw<T, E = Error>(value: T): Result<E, T>;

export { type Failure, type MaybePromise, type Result, type Success, failure, goTry, goTryRaw, isFailure, isSuccess, success };
