import type { Result, Success, Failure } from './types.js'

export function isSuccess<E, T>(result: Result<E, T>): result is Success<T> {
  return result[0] === undefined
}

export function isFailure<E, T>(result: Result<E, T>): result is Failure<E> {
  return result[0] !== undefined
}

export function success<T>(value: T): Success<T> {
  return [undefined, value] as const
}

export function failure<E>(error: E): Failure<E> {
  return [error, undefined] as const
}

/**
 * Helper for exhaustive switch checks on discriminated unions.
 * If this function is called, it means a case was forgotten in a switch statement.
 * Use this in the `default` case of switch statements handling tagged errors.
 *
 * @param value - The value that should be of type `never` if all cases are handled
 * @throws {Error} Always throws an error indicating unhandled case
 *
 * @example
 * const DatabaseError = taggedError('DatabaseError')
 * const NetworkError = taggedError('NetworkError')
 * type AppError = InstanceType<typeof DatabaseError> | InstanceType<typeof NetworkError>
 *
 * function handleError(err: AppError): string {
 *   switch (err._tag) {
 *     case 'DatabaseError':
 *       return `DB: ${err.message}`
 *     case 'NetworkError':
 *       return `NET: ${err.message}`
 *     default:
 *       // TypeScript will error if we forget a case above
 *       return assertNever(err)
 *   }
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${String(value)}`)
}
