/**
 * Asserts that a condition is true, otherwise throws the provided error.
 * Provides type narrowing when used with Result types.
 *
 * @param condition - The condition to assert
 * @param error - An Error instance or string message to throw if condition is falsy
 * @throws {Error} Throws the provided error if condition is falsy
 *
 * @example
 * // With Result type - narrows error to undefined after assertion
 * const [err, user] = goTryRaw(fetchUser(), DatabaseError)
 * assert(err === undefined, new DatabaseError('Failed to fetch user'))
 * // TypeScript now knows: err is undefined, user is User
 *
 * @example
 * // With string message
 * assert(response.ok, 'Response was not ok')
 *
 * @example
 * // With custom Error instance
 * assert(value > 0, new ValidationError('Value must be positive'))
 */
export function assert(condition: unknown, error: Error | string): asserts condition

/**
 * Asserts that a condition is true, otherwise instantiates and throws the error class.
 * Provides type narrowing when used with Result types.
 *
 * @param condition - The condition to assert
 * @param ErrorClass - An Error class constructor (e.g., from taggedError)
 * @param message - The error message to pass to the constructor
 * @throws {Error} Throws a new instance of ErrorClass if condition is falsy
 *
 * @example
 * const ValidationError = taggedError('ValidationError')
 * assert(value > 0, ValidationError, 'Value must be positive')
 * // Equivalent to: if (!(value > 0)) throw new ValidationError('Value must be positive')
 */
export function assert<T extends Error>(
  condition: unknown,
  ErrorClass: new (message: string) => T,
  message: string,
): asserts condition

export function assert(
  condition: unknown,
  errorOrClass: Error | string | (new (message: string) => Error),
  message?: string,
): asserts condition {
  if (!condition) {
    if (typeof errorOrClass === 'string') {
      throw new Error(errorOrClass)
    }
    if (typeof errorOrClass === 'function' && message !== undefined) {
      throw new errorOrClass(message)
    }
    throw errorOrClass
  }
}
