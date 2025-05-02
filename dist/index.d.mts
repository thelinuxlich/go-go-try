type Success<T> = readonly [undefined, T];
type Failure<E> = readonly [E, undefined];
type Result<E, T> = Success<T> | Failure<E>;
type MaybePromise<T> = T | Promise<T>;
declare function isSuccess<E, T>(result: Result<E, T>): result is Success<T>;
declare function isFailure<E, T>(result: Result<E, T>): result is Failure<E>;
declare function success<T>(value: T): Success<T>;
declare function failure<E>(error: E): Failure<E>;
/**
 * Executes a function, promise, or value and returns a Result type.
 * If an error occurs, it returns a Failure with the error message as a string.
 *
 * @template T The type of the successful result
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @returns {Result<string, T> | Promise<Result<string, T>>} A Result type or a Promise of a Result type
 *
 * @example
 * // With a value
 * const [err, result] = goTry(42);
 *
 * @example
 * // With a function
 * const [err, result] = goTry(() => JSON.parse('{"key": "value"}'));
 *
 * @example
 * // With a promise
 * const [err, result] = await goTry(fetch('https://api.example.com/data'));
 */
declare function goTry<T>(fn: () => never): Result<string, never>;
declare function goTry<T>(fn: () => Promise<T>): Promise<Result<string, T>>;
declare function goTry<T>(promise: Promise<T>): Promise<Result<string, T>>;
declare function goTry<T>(fn: () => T): Result<string, T>;
declare function goTry<T>(value: T): Result<string, T>;
/**
 * Executes a function, promise, or value and returns a Result type.
 * If an error occurs, it returns a Failure with the raw error object.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to Error
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @returns {Result<E, T> | Promise<Result<E, T>>} A Result type or a Promise of a Result type
 *
 * @example
 * // With a value
 * const [err, result] = goTryRaw(42);
 *
 * @example
 * // With a function
 * const [err, result] = goTryRaw(() => JSON.parse('{"key": "value"}'));
 *
 * @example
 * // With a promise
 * const [err, result] = await goTryRaw(fetch('https://api.example.com/data'));
 */
declare function goTryRaw<T, E = Error>(fn: () => never): Result<E, never>;
declare function goTryRaw<T, E = Error>(fn: () => Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(promise: Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>;
declare function goTryRaw<T, E = Error>(value: T): Result<E, T>;

export { type Failure, type MaybePromise, type Result, type Success, failure, goTry, goTryRaw, isFailure, isSuccess, success };
