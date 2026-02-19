import type { GoTryAllOptions, GoTryAllRawOptions, ErrorConstructor } from './types.js'
import { isError, getErrorMessage, type PromiseFactory } from './internals.js'
import { UnknownError } from './unknown-error.js'

/**
 * Checks if a value is a tagged error (has a _tag property).
 */
function isTaggedError(err: unknown): err is { _tag: string } {
  return isError(err) && '_tag' in err && typeof (err as { _tag?: unknown })._tag === 'string'
}

/**
 * Wraps an error based on the provided options (errorClass/systemErrorClass).
 * Consistent with goTryRaw behavior.
 */
function wrapError<E>(err: unknown, errorClass: ErrorConstructor<E> | undefined, systemErrorClass: ErrorConstructor<E> | undefined): E {
  // If errorClass is specified, wrap all errors with it
  if (errorClass) {
    if (err === undefined) {
      return new errorClass('undefined')
    }
    if (isError(err)) {
      return new errorClass(err.message, { cause: err })
    }
    return new errorClass(String(err))
  }

  // If systemErrorClass is specified (or defaulted to UnknownError), only wrap non-tagged errors
  const actualSystemErrorClass = systemErrorClass ?? UnknownError
  if (isTaggedError(err)) {
    return err as unknown as E
  }
  if (err === undefined) {
    return new actualSystemErrorClass('undefined') as unknown as E
  }
  if (isError(err)) {
    return new actualSystemErrorClass(err.message, { cause: err }) as unknown as E
  }
  return new actualSystemErrorClass(String(err)) as unknown as E
}

async function runWithConcurrency<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | PromiseFactory<T[K]> },
  concurrency: number,
): Promise<PromiseSettledResult<T[number]>[]> {
  if (items.length === 0) {
    return []
  }

  // Auto-detect factory mode by checking if first item is a function
  const isFactoryMode = typeof items[0] === 'function'

  // concurrency of 0 means unlimited (run all in parallel)
  if (!isFactoryMode && (concurrency <= 0)) {
    return Promise.allSettled(items as Promise<T[number]>[])
  }

  const results: PromiseSettledResult<T[number]>[] = new Array(items.length)
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++
      try {
        const item = items[currentIndex]
        // If factory mode, call the function; otherwise await the promise directly
        const value = isFactoryMode
          ? await (item as PromiseFactory<T[number]>)()
          : await (item as Promise<T[number]>)
        results[currentIndex] = { status: 'fulfilled', value }
      } catch (reason) {
        results[currentIndex] = { status: 'rejected', reason }
      }
    }
  }

  // Determine number of workers
  const workerCount = concurrency <= 0 ? items.length : Math.min(concurrency, items.length)

  // Start workers
  const workers: Promise<void>[] = []
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker())
  }

  await Promise.all(workers)
  return results
}

/**
 * Executes multiple promises or factory functions in parallel (or with limited concurrency)
 * and returns a tuple of [errors, results]. Unlike Promise.all, this doesn't fail fast -
 * it waits for all promises to settle.
 *
 * Accepts either:
 * - An array of promises (for simple parallel execution)
 * - An array of factory functions that return promises (for lazy execution with concurrency control)
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) }]} items - Array of promises or factories
 * @param {GoTryAllOptions} options - Optional configuration
 * @returns {Promise<[{ [K in keyof T]: string | undefined }, { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is a tuple of errors (or undefined) and
 *          the second element is a tuple of results (or undefined), preserving input order
 *
 * @example
 * // Run all in parallel (default) - with promises
 * const [errors, results] = await goTryAll([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ])
 *
 * @example
 * // Limit concurrency with factory functions (lazy execution)
 * const [errors, results] = await goTryAll([
 *   () => fetchUser(1),  // Only called when a slot is available
 *   () => fetchUser(2),  // Only called when a slot is available
 *   () => fetchUser(3),  // Only called when a slot is available
 * ], { concurrency: 2 })
 */
export async function goTryAll<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllOptions,
): Promise<[{ [K in keyof T]: string | undefined }, { [K in keyof T]: T[K] | undefined }]> {
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0)

  const errors = [] as { [K in keyof T]: string | undefined }
  const results = [] as { [K in keyof T]: T[K] | undefined }

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i]!
    if (item.status === 'fulfilled') {
      ;(errors as (string | undefined)[])[i] = undefined
      ;(results as unknown[])[i] = (item as PromiseFulfilledResult<T[number]>).value
    } else {
      ;(errors as (string | undefined)[])[i] = getErrorMessage((item as PromiseRejectedResult).reason)
      ;(results as unknown[])[i] = undefined
    }
  }

  return [errors, results]
}

/**
 * Like `goTryAll`, but returns raw Error objects instead of error messages.
 * Non-tagged errors are wrapped in `UnknownError` by default (consistent with `goTryRaw`).
 * Tagged errors pass through unchanged.
 *
 * Supports `errorClass` and `systemErrorClass` options (mutually exclusive):
 * - `errorClass`: Wrap ALL errors in the specified class
 * - `systemErrorClass`: Only wrap non-tagged errors (defaults to UnknownError)
 *
 * @template T The tuple type of all promise results
 * @template E The type of the error
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) }]} items - Array of promises or factories
 * @param {GoTryAllRawOptions<E>} options - Optional configuration
 * @returns {Promise<[{ [K in keyof T]: E | undefined }, { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is a tuple of Error objects (or undefined) and
 *          the second element is a tuple of results (or undefined), preserving input order
 */
export async function goTryAllRaw<T extends readonly unknown[], E = InstanceType<typeof UnknownError>>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllRawOptions<E>,
): Promise<[{ [K in keyof T]: E | undefined }, { [K in keyof T]: T[K] | undefined }]> {
  const { errorClass, systemErrorClass } = options || {}
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0)

  const errors = [] as { [K in keyof T]: E | undefined }
  const results = [] as { [K in keyof T]: T[K] | undefined }

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i]!
    if (item.status === 'fulfilled') {
      ;(errors as (E | undefined)[])[i] = undefined
      ;(results as unknown[])[i] = (item as PromiseFulfilledResult<T[number]>).value
    } else {
      const reason = (item as PromiseRejectedResult).reason
      ;(errors as (E | undefined)[])[i] = wrapError(reason, errorClass, systemErrorClass)
      ;(results as unknown[])[i] = undefined
    }
  }

  return [errors, results]
}
