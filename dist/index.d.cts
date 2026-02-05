type Success<T> = readonly [undefined, T];
type Failure<E> = readonly [E, undefined];
type Result<E, T> = Success<T> | Failure<E>;
type ResultWithDefault<E, T> = readonly [E | undefined, T];
type MaybePromise<T> = T | Promise<T>;
declare function isSuccess<E, T>(result: Result<E, T>): result is Success<T>;
declare function isFailure<E, T>(result: Result<E, T>): result is Failure<E>;
declare function success<T>(value: T): Success<T>;
declare function failure<E>(error: E): Failure<E>;
/**
 * Executes a function, promise, or value and returns a Result type with a fallback default.
 * If an error occurs, it returns the error message and the default value.
 *
 * @template T The type of the successful result
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @param {T | (() => T)} defaultValue - The default value or a function to compute it (only called on failure)
 * @returns {ResultWithDefault<string, T> | Promise<ResultWithDefault<string, T>>} A tuple of [error, value] or Promise thereof
 *
 * @example
 * // With a static default
 * const [err, config] = goTryOr(() => JSON.parse('invalid'), { port: 3000 })
 * // err is the error message, config is { port: 3000 }
 *
 * @example
 * // With a computed default (lazy evaluation)
 * const [err, user] = await goTryOr(fetchUser(id), () => ({
 *   id: 'anonymous',
 *   name: 'Guest'
 * }))
 */
declare function goTryOr<T>(fn: () => never, defaultValue: T | (() => T)): ResultWithDefault<string, T>;
declare function goTryOr<T>(fn: () => Promise<T>, defaultValue: T | (() => T)): Promise<ResultWithDefault<string, T>>;
declare function goTryOr<T>(promise: Promise<T>, defaultValue: T | (() => T)): Promise<ResultWithDefault<string, T>>;
declare function goTryOr<T>(fn: () => T, defaultValue: T | (() => T)): ResultWithDefault<string, T>;
declare function goTryOr<T>(value: T, defaultValue: T | (() => T)): ResultWithDefault<string, T>;
/**
 * Executes multiple promises in parallel and returns a tuple of [errors, results].
 * Unlike Promise.all, this doesn't fail fast - it waits for all promises to settle.
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> }]} promises - Array of promises to execute
 * @returns {Promise<[(string | undefined)[], { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is an array of errors (or undefined) and
 *          the second element is an array of results (or undefined)
 *
 * @example
 * const [errors, results] = await goTryAll([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ])
 *
 * // errors: (string | undefined)[]
 * // results: (User | undefined)[]
 */
declare function goTryAll<T extends readonly unknown[]>(promises: {
    [K in keyof T]: Promise<T[K]>;
}): Promise<[(string | undefined)[], {
    [K in keyof T]: T[K] | undefined;
}]>;
/**
 * Similar to goTryAll, but returns the raw Error objects instead of just error messages.
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> }]} promises - Array of promises to execute
 * @returns {Promise<[(Error | undefined)[], { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is an array of Error objects (or undefined) and
 *          the second element is an array of results (or undefined)
 */
declare function goTrySettled<T extends readonly unknown[]>(promises: {
    [K in keyof T]: Promise<T[K]>;
}): Promise<[(Error | undefined)[], {
    [K in keyof T]: T[K] | undefined;
}]>;
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

export { failure, goTry, goTryAll, goTryOr, goTryRaw, goTrySettled, isFailure, isSuccess, success };
export type { Failure, MaybePromise, Result, ResultWithDefault, Success };
//# sourceMappingURL=index.d.cts.map
