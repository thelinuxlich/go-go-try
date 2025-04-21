/**
 * Type for a successful result
 */
type Success<T> = readonly [undefined, T];
/**
 * Type for an error result
 */
type Failure<E> = readonly [E, undefined];
/**
 * Type for a result that can be either success or failure
 */
type Result<E, T> = Success<T> | Failure<E>;
/**
 * Type guard to check if a result is a success
 */
declare function isSuccess<E, T>(result: Result<E, T>): result is Success<T>;
/**
 * Type guard to check if a result is a failure
 */
declare function isFailure<E, T>(result: Result<E, T>): result is Failure<E>;
/**
 * Helper to create a success result
 */
declare function success<T>(value: T): Success<T>;
/**
 * Helper to create a failure result
 */
declare function failure<E>(error: E): Failure<E>;
/**
 * Executes a synchronous function and returns a Result
 */
declare function goTry<T>(fn: () => T): Result<string, T>;
/**
 * Handles a value directly and returns a Result
 */
declare function goTry<T>(value: T): Result<string, T>;
/**
 * Handles a promise and returns a Promise<Result>
 */
declare function goTry<T>(promise: PromiseLike<T>): Promise<Result<string, T>>;
/**
 * Executes a synchronous function and returns a Result with the raw error
 */
declare function goTryRaw<E = unknown, T = unknown>(fn: () => T): Result<E, T>;
/**
 * Handles a value directly and returns a Result
 */
declare function goTryRaw<E = unknown, T = unknown>(value: T): Result<E, T>;
/**
 * Handles a promise and returns a Promise<Result> with the raw error
 */
declare function goTryRaw<E = unknown, T = unknown>(promise: PromiseLike<T>): Promise<Result<E, T>>;

export { type Failure, type Result, type Success, failure, goTry, goTryRaw, isFailure, isSuccess, success };
