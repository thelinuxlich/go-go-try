export type Success<T> = readonly [undefined, T]

export type Failure<E> = readonly [E, undefined]

export type Result<E, T> = Success<T> | Failure<E>

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

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  )
}
export function goTry<T>(fn: () => T): Result<string, T>
export function goTry<T>(value: T): Result<string, T>
export function goTry<T>(promise: PromiseLike<T>): Promise<Result<string, T>>

export function goTry<T>(
  value: T | (() => T) | PromiseLike<T>,
): Result<string, T> | Promise<Result<string, T>> {
  if (isPromiseLike<T>(value)) {
    return Promise.resolve(value)
      .then((value) => success(value))
      .catch((err) => failure(getErrorMessage(err)))
  }

  try {
    const result = typeof value === 'function' ? (value as () => T)() : value
    return success(result)
  } catch (err) {
    return failure(getErrorMessage(err))
  }
}
export function goTryRaw<E = unknown, T = unknown>(fn: () => T): Result<E, T>
export function goTryRaw<E = unknown, T = unknown>(value: T): Result<E, T>
export function goTryRaw<E = unknown, T = unknown>(
  promise: PromiseLike<T>,
): Promise<Result<E, T>>

export function goTryRaw<E = unknown, T = unknown>(
  value: T | (() => T) | PromiseLike<T>,
): Result<E, T> | Promise<Result<E, T>> {
  if (isPromiseLike<T>(value)) {
    return Promise.resolve(value)
      .then((value) => success<T>(value))
      .catch((err) => failure<E>(err as E))
  }
  try {
    const result = typeof value === 'function' ? (value as () => T)() : value
    return success<T>(result)
  } catch (err) {
    return failure<E>(err as E)
  }
}
