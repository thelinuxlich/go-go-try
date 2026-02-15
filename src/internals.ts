/**
 * Internal utility functions (not exported from index)
 */

export type PromiseFactory<T> = () => Promise<T>

export function getErrorMessage(error: unknown): string {
  if (error === undefined) return 'undefined'

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
    // fallback in case there's an error stringifying the error
    // with circular references for example.
    return String(error)
  }
}

export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  )
}

export function isError(value: unknown): value is Error {
  return value instanceof Error
}

export function resolveDefault<T>(defaultValue: T | (() => T)): T {
  return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue
}
