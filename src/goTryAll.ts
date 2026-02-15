import type { GoTryAllOptions } from './types.js'
import { isError, getErrorMessage, type PromiseFactory } from './internals.js'

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
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) }]} items - Array of promises or factories
 * @param {GoTryAllOptions} options - Optional configuration
 * @returns {Promise<[{ [K in keyof T]: Error | undefined }, { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is a tuple of Error objects (or undefined) and
 *          the second element is a tuple of results (or undefined), preserving input order
 */
export async function goTryAllRaw<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllOptions,
): Promise<[{ [K in keyof T]: Error | undefined }, { [K in keyof T]: T[K] | undefined }]> {
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0)

  const errors = [] as { [K in keyof T]: Error | undefined }
  const results = [] as { [K in keyof T]: T[K] | undefined }

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i]!
    if (item.status === 'fulfilled') {
      ;(errors as (Error | undefined)[])[i] = undefined
      ;(results as unknown[])[i] = (item as PromiseFulfilledResult<T[number]>).value
    } else {
      const reason = (item as PromiseRejectedResult).reason
      ;(errors as (Error | undefined)[])[i] = isError(reason)
        ? reason
        : new Error(String(reason))
      ;(results as unknown[])[i] = undefined
    }
  }

  return [errors, results]
}
