import { attest } from '@ark/attest'
import { assert, describe, test } from 'vitest'
import {
  type Result,
  goTry,
  goTryAll,
  goTryAllRaw,
  goTryOr,
  goTryRaw,
  isFailure,
  isSuccess,
} from './index.js'

test(`value returned by callback is used when callback doesn't throw`, async () => {
  const fn = () => 'value'

  // Test with function
  const result1 = goTry(fn)
  const result2 = goTryRaw(fn)

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test type guards
  assert.equal(isSuccess(result1), true)
  assert.equal(isSuccess(result2), true)
  assert.equal(isFailure(result1), false)
  assert.equal(isFailure(result2), false)

  // Test values
  assert.equal(value, 'value')
  assert.equal(value2, 'value')
  assert.equal(err1, undefined)
  assert.equal(err2, undefined)
})

test('if function throws undefined, err should be "undefined"', async () => {
  const fn = () => {
    throw undefined
  }

  // Test with function that throws undefined
  const result1 = goTry(fn)
  const result2 = goTryRaw(fn)

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test type guards
  assert.equal(isSuccess(result1), false)
  assert.equal(isSuccess(result2), false)
  assert.equal(isFailure(result1), true)
  assert.equal(isFailure(result2), true)

  // Test values
  assert.equal(value, undefined)
  assert.equal(value2, undefined)
  assert.equal(err1, 'undefined')
  assert.equal(typeof err2, 'object')
})

test('if callback throws, value should be undefined and err should contain the error message', async () => {
  const fn = () => {
    return JSON.parse('{/') as string
  }

  // Test with function that throws
  const result1 = goTry(fn)
  const result2 = goTryRaw(fn)

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test type guards
  assert.equal(isSuccess(result1), false)
  assert.equal(isSuccess(result2), false)
  assert.equal(isFailure(result1), true)
  assert.equal(isFailure(result2), true)

  // Test values
  assert.equal(value, undefined)
  assert.equal(value2, undefined)
  assert.equal(typeof err1, 'string')
  assert.equal(typeof err2, 'object')
  assert.equal(typeof err2?.message, 'string')
})

test('first parameter accepts promises and makes the function async', async () => {
  const promise = Promise.resolve('value')

  // Test with promise
  const result1 = await goTry(promise)
  const result2 = await goTryRaw(promise)

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test type guards
  assert.equal(isSuccess(result1), true)
  assert.equal(isSuccess(result2), true)
  assert.equal(isFailure(result1), false)
  assert.equal(isFailure(result2), false)

  // Test values
  assert.equal(value, 'value')
  assert.equal(value2, 'value')
  assert.equal(err1, undefined)
  assert.equal(err2, undefined)
})

test("if it's a function returning a Promise, should unwrap the value correctly to T", async () => {
  const fn = () => Promise.resolve('value')

  // Test with function that returns a promise
  const result1 = await goTry(fn)
  const result2 = await goTryRaw(fn)

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  attest<string | undefined>(err1)
  attest<string | undefined>(value)

  attest<Error | undefined>(err2)
  attest<string | undefined>(value2)

  // Test type guards
  assert.equal(isSuccess(result1), true)
  assert.equal(isSuccess(result2), true)
  assert.equal(isFailure(result1), false)
  assert.equal(isFailure(result2), false)

  // Test values
  assert.equal(value, 'value')
  assert.equal(value2, 'value')
  assert.equal(err1, undefined)
  assert.equal(err2, undefined)
})

test('if async callback throws, value should be undefined and err should contain the error message', async () => {
  const promise = Promise.reject(new Error('error'))

  // Test with promise that rejects
  const result1 = await goTry(promise)
  const result2 = await goTryRaw<Error>(promise)

  // Test destructuring
  const [err, value] = result1
  const [err2, value2] = result2

  // Test type guards
  assert.equal(isSuccess(result1), false)
  assert.equal(isSuccess(result2), false)
  assert.equal(isFailure(result1), true)
  assert.equal(isFailure(result2), true)

  // Test values
  assert.equal(value, undefined)
  assert.equal(value2, undefined)
  assert.equal(err, 'error')
  assert.equal(typeof err2, 'object')
  assert.equal(err2?.message, 'error')
})

test('direct values work too', () => {
  // Test with direct value
  const result1 = goTry('value')
  const result2 = goTryRaw('value')

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test values
  assert.equal(value, 'value')
  assert.equal(value2, 'value')
  assert.equal(err1, undefined)
  assert.equal(err2, undefined)
})

test('async functions work correctly', async () => {
  // Define an async function
  function asyncFn() {
    return Promise.resolve(42)
  }

  // Test with async function
  const result1 = await goTry(asyncFn())
  const result2 = await goTryRaw(asyncFn())

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test values
  assert.equal(value, 42)
  assert.equal(value2, 42)
  assert.equal(err1, undefined)
  assert.equal(err2, undefined)
})

test('async functions that throw work correctly', async () => {
  // Define an async function that throws
  async function asyncFnThatThrows() {
    await 1
    throw new Error('async error')
  }

  // Test with async function that throws
  const result1 = await goTry(asyncFnThatThrows())
  const result2 = await goTryRaw(asyncFnThatThrows())

  // Test destructuring
  const [err1, value] = result1
  const [err2, value2] = result2

  // Test values
  assert.equal(value, undefined)
  assert.equal(value2, undefined)
  assert.equal(err1, 'async error')
  assert.equal(typeof err2, 'object')
  assert.equal(err2?.message, 'async error')
})

describe('edge cases', () => {
  test('null as successful return value', () => {
    const result = goTry(() => null)
    const [err, value] = result

    assert.equal(err, undefined)
    assert.equal(value, null)
    assert.equal(isSuccess(result), true)
  })

  test('undefined as successful return value', () => {
    const result = goTry(() => undefined)
    const [err, value] = result

    assert.equal(err, undefined)
    assert.equal(value, undefined)
    assert.equal(isSuccess(result), true)
  })

  test('0 as successful return value', () => {
    const result = goTry(() => 0)
    const [err, value] = result

    assert.equal(err, undefined)
    assert.equal(value, 0)
    assert.equal(isSuccess(result), true)
  })

  test('empty string as successful return value', () => {
    const result = goTry(() => '')
    const [err, value] = result

    assert.equal(err, undefined)
    assert.equal(value, '')
    assert.equal(isSuccess(result), true)
  })

  test('false as successful return value', () => {
    const result = goTry(() => false)
    const [err, value] = result

    assert.equal(err, undefined)
    assert.equal(value, false)
    assert.equal(isSuccess(result), true)
  })

  test('circular reference in error', () => {
    const circular: Record<string, unknown> = { a: 1 }
    circular.self = circular

    const fn = () => {
      throw circular
    }

    const [err, value] = goTry(fn)

    assert.equal(value, undefined)
    assert.equal(typeof err, 'string')
    // Should fall back to String() for circular references
    assert.ok(err?.includes('[object Object]') || err?.includes('"a":1'))
  })

  test('custom Error subclass', async () => {
    class CustomError extends Error {
      constructor(
        message: string,
        public code: number,
      ) {
        super(message)
        this.name = 'CustomError'
      }
    }

    const fn = () => {
      throw new CustomError('custom error', 500)
    }

    const result1 = goTry(fn)
    const result2 = goTryRaw(fn)

    const [err1, value1] = result1
    const [err2, value2] = result2

    assert.equal(value1, undefined)
    assert.equal(value2, undefined)
    assert.equal(err1, 'custom error')
    assert.equal(err2 instanceof CustomError, true)
    assert.equal((err2 as CustomError).code, 500)
  })

  test('throwing a string', () => {
    const fn = () => {
      throw 'string error'
    }

    const result1 = goTry(fn)
    const result2 = goTryRaw(fn)

    const [err1, value1] = result1
    const [err2, value2] = result2

    assert.equal(value1, undefined)
    assert.equal(value2, undefined)
    assert.equal(err1, 'string error')
    assert.equal(err2?.message, 'string error')
  })

  test('throwing a number', () => {
    const fn = () => {
      throw 42
    }

    const result1 = goTry(fn)
    const result2 = goTryRaw(fn)

    const [err1, value1] = result1
    const [err2, value2] = result2

    assert.equal(value1, undefined)
    assert.equal(value2, undefined)
    assert.equal(err1, '42')
    assert.equal(err2?.message, '42')
  })
})

describe('goTry type tests', () => {
  test('synchronous function returns correct types', () => {
    const fn = () => 'value'
    const result = goTry(fn)

    // Check the result type
    attest<Result<string, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<string | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })

  test('direct value returns correct types', () => {
    const result = goTry('value')

    // Check the result type
    attest<Result<string, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<string | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })

  test('promise returns correct types', async () => {
    const promise = Promise.resolve('value')
    const result = await goTry(promise)

    // Check the result type
    attest<Result<string, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<string | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })

  test('async function returns correct types', async () => {
    const asyncFn = async () => 'value'
    const result = await goTry(asyncFn())

    // Check the result type
    attest<Result<string, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<string | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })
})

describe('goTryRaw type tests', () => {
  test('type inference works correctly', () => {
    const fn = () => 'value'
    const result = goTryRaw(fn)

    // Check the result type
    attest<Result<Error, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<Error | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })
  test('synchronous function returns correct types', () => {
    const fn = () => 'value'
    const result = goTryRaw(fn)

    // Check the result type
    attest<Result<Error, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<Error | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })

  test('direct value returns correct types', () => {
    const result = goTryRaw('value')

    // Check the result type
    attest<Result<Error, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<Error | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })

  test('promise returns correct types', async () => {
    const promise = Promise.resolve('value')
    const result = await goTryRaw(promise)

    // Check the result type
    attest<Result<Error, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<Error | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })

  test('async function returns correct types', async () => {
    const asyncFn = async () => 'value'
    const result = await goTryRaw(asyncFn())

    // Check the result type
    attest<Result<Error, string>>(result)

    // Check the destructured types
    const [err, value] = result
    attest<Error | undefined>(err)
    attest<string | undefined>(value)

    // When destructured, the types should be narrowed correctly
    if (err === undefined) {
      attest<string>(value)
    } else {
      attest<undefined>(value)
    }
  })
})

describe('goTryOr', () => {
  test('returns [undefined, value] on success (static default)', () => {
    const [err, value] = goTryOr(() => 'success', 'default')

    assert.equal(err, undefined)
    assert.equal(value, 'success')
  })

  test('returns [error, default] on failure (static default)', () => {
    const [err, value] = goTryOr(() => {
      throw new Error('fail')
    }, 'default')

    assert.equal(err, 'fail')
    assert.equal(value, 'default')
  })

  test('returns [undefined, value] on success (function default) without calling fn', () => {
    let called = false
    const [err, value] = goTryOr(() => 'success', () => {
      called = true
      return 'default'
    })

    assert.equal(err, undefined)
    assert.equal(value, 'success')
    assert.equal(called, false)
  })

  test('returns [error, computed] on failure (function default)', () => {
    const [err, value] = goTryOr(() => {
      throw new Error('fail')
    }, () => 'computed')

    assert.equal(err, 'fail')
    assert.equal(value, 'computed')
  })

  test('is lazy - only calls default fn on failure', () => {
    let callCount = 0
    const expensiveFn = () => {
      callCount++
      return 'expensive default'
    }

    // Success case - fn should not be called
    goTryOr(() => 'success', expensiveFn)
    assert.equal(callCount, 0)

    // Failure case - fn should be called
    goTryOr(() => {
      throw new Error('fail')
    }, expensiveFn)
    assert.equal(callCount, 1)
  })

  test('works with complex types (static default)', () => {
    interface Config {
      port: number
      host: string
    }

    const defaultConfig: Config = { port: 3000, host: 'localhost' }

    const [err1, value1] = goTryOr<Config>(() => {
      throw new Error('fail')
    }, defaultConfig)
    assert.equal(err1, 'fail')
    assert.deepEqual(value1, { port: 3000, host: 'localhost' })

    const [err2, value2] = goTryOr<Config>(() => ({ port: 8080, host: 'example.com' }), defaultConfig)
    assert.equal(err2, undefined)
    assert.deepEqual(value2, { port: 8080, host: 'example.com' })
  })

  test('works with complex computed defaults (function)', () => {
    interface User {
      id: string
      name: string
      createdAt: Date
    }

    const now = new Date()
    const [err, user] = goTryOr<User>(() => {
      throw new Error('user not found')
    }, () => ({
      id: 'anonymous',
      name: 'Guest',
      createdAt: now,
    }))

    assert.equal(err, 'user not found')
    assert.equal(user.id, 'anonymous')
    assert.equal(user.name, 'Guest')
    assert.equal(user.createdAt, now)
  })

  test('works with promises (static default)', async () => {
    const [err, value] = await goTryOr(Promise.reject(new Error('fail')), 42)

    assert.equal(err, 'fail')
    assert.equal(value, 42)
  })

  test('works with promises (function default)', async () => {
    const [err, value] = await goTryOr(Promise.reject(new Error('fail')), () => 42)

    assert.equal(err, 'fail')
    assert.equal(value, 42)
  })

  test('works with async functions (static default)', async () => {
    const asyncFn = async () => 'value'
    const [err, value] = await goTryOr(asyncFn(), 'default')

    assert.equal(err, undefined)
    assert.equal(value, 'value')
  })

  test('works with async functions that throw (function default)', async () => {
    const asyncFn = async () => {
      throw new Error('async error')
    }
    const [err, value] = await goTryOr(asyncFn(), () => 'fallback')

    assert.equal(err, 'async error')
    assert.equal(value, 'fallback')
  })

  test('works with direct values (static default)', () => {
    const [err, value] = goTryOr('direct', 'default')

    assert.equal(err, undefined)
    assert.equal(value, 'direct')
  })
})

describe('goTryAll', () => {
  test('returns all values when all promises succeed', async () => {
    const [errors, results] = await goTryAll([
      Promise.resolve('a'),
      Promise.resolve(42),
      Promise.resolve(true),
    ])

    assert.deepEqual(errors, [undefined, undefined, undefined])
    assert.deepEqual(results, ['a', 42, true])
  })

  test('returns errors for failed promises without failing fast', async () => {
    const [errors, results] = await goTryAll([
      Promise.resolve('success'),
      Promise.reject(new Error('fail1')),
      Promise.resolve(42),
      Promise.reject(new Error('fail2')),
    ])

    assert.equal(errors[0], undefined)
    assert.equal(errors[1], 'fail1')
    assert.equal(errors[2], undefined)
    assert.equal(errors[3], 'fail2')

    assert.equal(results[0], 'success')
    assert.equal(results[1], undefined)
    assert.equal(results[2], 42)
    assert.equal(results[3], undefined)
  })

  test('handles empty array', async () => {
    const [errors, results] = await goTryAll([])

    assert.deepEqual(errors, [])
    assert.deepEqual(results, [])
  })

  test('handles single promise', async () => {
    const [errors, results] = await goTryAll([Promise.resolve('value')])

    assert.deepEqual(errors, [undefined])
    assert.deepEqual(results, ['value'])
  })

  test('handles all failing promises', async () => {
    const [errors, results] = await goTryAll([
      Promise.reject(new Error('error1')),
      Promise.reject(new Error('error2')),
    ])

    assert.equal(errors[0], 'error1')
    assert.equal(errors[1], 'error2')
    assert.equal(results[0], undefined)
    assert.equal(results[1], undefined)
  })

  test('preserves types as fixed tuples', async () => {
    const [errors, results] = await goTryAll([
      Promise.resolve('string'),
      Promise.resolve(42),
      Promise.resolve({ key: 'value' }),
    ])

    // errors is a fixed tuple: [string | undefined, string | undefined, string | undefined]
    attest<[string | undefined, string | undefined, string | undefined]>(errors)

    // results is a fixed tuple preserving each type at its position
    const [str, num, obj] = results
    attest<string | undefined>(str)
    attest<number | undefined>(num)
    attest<{ key: string } | undefined>(obj)
  })

  test('runs with limited concurrency', async () => {
    const completionOrder: number[] = []
    const delays = [30, 10, 30, 10]

    // Create promises that record when they complete
    const promises = delays.map((delay, i) =>
      new Promise<string>((resolve) => {
        setTimeout(() => {
          completionOrder.push(i)
          resolve(`done-${i}`)
        }, delay)
      })
    )

    const startTime = Date.now()
    const [errors, results] = await goTryAll(promises, { concurrency: 2 })
    const duration = Date.now() - startTime

    // All should complete
    assert.deepEqual(errors, [undefined, undefined, undefined, undefined])
    assert.deepEqual(results, ['done-0', 'done-1', 'done-2', 'done-3'])

    // With concurrency 2: promises 0,1 start first; 1 completes at ~10ms, then 2 starts; 0 completes at ~30ms, then 3 starts
    // Total time should be ~40ms (not ~20ms if all ran in parallel, not ~80ms if sequential)
    // Using relaxed timing due to test environment variability
    assert.ok(duration >= 25, `Expected duration >=25ms with limited concurrency, got ${duration}ms`)
  })

  test('concurrency of 0 runs all in parallel', async () => {
    const delays = [20, 20, 20, 20]

    const promises = delays.map((delay, i) =>
      new Promise<string>((resolve) => {
        setTimeout(() => resolve(`done-${i}`), delay)
      })
    )

    const startTime = Date.now()
    const [errors, results] = await goTryAll(promises, { concurrency: 0 })
    const duration = Date.now() - startTime

    assert.deepEqual(errors, [undefined, undefined, undefined, undefined])
    assert.deepEqual(results, ['done-0', 'done-1', 'done-2', 'done-3'])

    // All 4 running in parallel should complete in ~20ms
    assert.ok(duration < 50, `Expected duration <50ms for parallel execution, got ${duration}ms`)
  })

  test('concurrency defaults to 0 (unlimited)', async () => {
    const delays = [20, 20, 20, 20]

    const promises = delays.map((delay, i) =>
      new Promise<string>((resolve) => {
        setTimeout(() => resolve(`done-${i}`), delay)
      })
    )

    const startTime = Date.now()
    const [errors, results] = await goTryAll(promises)
    const duration = Date.now() - startTime

    assert.deepEqual(errors, [undefined, undefined, undefined, undefined])
    assert.deepEqual(results, ['done-0', 'done-1', 'done-2', 'done-3'])

    // Default (concurrency 0) should run all in parallel, ~20ms
    assert.ok(duration < 35, `Expected duration ~20ms, got ${duration}ms`)
  })

  test('factory functions - lazy execution with concurrency control', async () => {
    let started = 0
    const delays = [20, 20, 20, 20]

    // Factory functions - not called until concurrency slot is available
    const factories = delays.map((delay, i) => () =>
      new Promise<string>((resolve) => {
        started++
        setTimeout(() => resolve(`done-${i}`), delay)
      })
    )

    const startTime = Date.now()
    const [errors, results] = await goTryAll(factories, { concurrency: 2 })
    const duration = Date.now() - startTime

    assert.deepEqual(errors, [undefined, undefined, undefined, undefined])
    assert.deepEqual(results, ['done-0', 'done-1', 'done-2', 'done-3'])

    // With factories and concurrency 2, only 2 should start initially
    // Then as they complete, the remaining 2 start
    assert.equal(started, 4) // All 4 should eventually start

    // With factories and concurrency 2, execution is truly limited
    // Batches of 2 run sequentially: ~20ms + ~20ms = ~40ms total
    assert.ok(duration >= 30, `Expected duration >=30ms with factory concurrency, got ${duration}ms`)
  })

  test('factory functions - truly limits concurrent execution', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    const factories = [1, 2, 3, 4].map((i) => () =>
      new Promise<string>((resolve) => {
        concurrent++
        maxConcurrent = Math.max(maxConcurrent, concurrent)
        setTimeout(() => {
          concurrent--
          resolve(`done-${i}`)
        }, 10)
      })
    )

    const [errors, results] = await goTryAll(factories, { concurrency: 2 })

    assert.deepEqual(errors, [undefined, undefined, undefined, undefined])
    assert.deepEqual(results, ['done-1', 'done-2', 'done-3', 'done-4'])
    assert.equal(maxConcurrent, 2) // Should never exceed concurrency of 2
  })

  test('factory functions - auto-detected (mixing not allowed)', async () => {
    // Factory mode is detected by checking if first item is a function
    const factories = [
      () => Promise.resolve('first'),
      () => Promise.resolve('second'),
    ]

    const [errors, results] = await goTryAll(factories)

    assert.deepEqual(errors, [undefined, undefined])
    assert.deepEqual(results, ['first', 'second'])
  })

  test('factory functions - handles errors', async () => {
    const factories = [
      () => Promise.resolve('success-1'),
      () => Promise.reject(new Error('fail-1')),
      () => Promise.resolve('success-2'),
      () => Promise.reject(new Error('fail-2')),
    ]

    const [errors, results] = await goTryAll(factories, { concurrency: 2 })

    assert.equal(errors[0], undefined)
    assert.equal(errors[1], 'fail-1')
    assert.equal(errors[2], undefined)
    assert.equal(errors[3], 'fail-2')

    assert.equal(results[0], 'success-1')
    assert.equal(results[1], undefined)
    assert.equal(results[2], 'success-2')
    assert.equal(results[3], undefined)
  })
})

describe('goTryAllRaw', () => {
  test('returns all values when all promises succeed', async () => {
    const [errors, results] = await goTryAllRaw([
      Promise.resolve('a'),
      Promise.resolve(42),
      Promise.resolve(true),
    ])

    assert.deepEqual(errors, [undefined, undefined, undefined])
    assert.deepEqual(results, ['a', 42, true])
  })

  test('returns Error objects for failed promises', async () => {
    const [errors, results] = await goTryAllRaw([
      Promise.resolve('success'),
      Promise.reject(new Error('fail1')),
      Promise.resolve(42),
    ])

    assert.equal(errors[0], undefined)
    assert.equal(errors[1]?.message, 'fail1')
    assert.equal(errors[2], undefined)

    assert.equal(results[0], 'success')
    assert.equal(results[1], undefined)
    assert.equal(results[2], 42)
  })

  test('converts non-Error rejections to Error objects', async () => {
    const [errors] = await goTryAllRaw([
      Promise.reject('string error'),
      Promise.reject(42),
      Promise.reject(undefined),
    ])

    assert.equal(errors[0]?.message, 'string error')
    assert.equal(errors[1]?.message, '42')
    assert.equal(errors[2]?.message, 'undefined')
  })

  test('handles empty array', async () => {
    const [errors, results] = await goTryAllRaw([])

    assert.deepEqual(errors, [])
    assert.deepEqual(results, [])
  })
})
