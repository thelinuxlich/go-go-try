import { attest } from '@ark/attest'
import { assert, describe, test } from 'vitest'
import {
  type Result,
  type TaggedUnion,
  assert as assertTry,
  assertNever,
  failure,
  goTry,
  goTryAll,
  goTryAllRaw,
  goTryOr,
  goTryRaw,
  isFailure,
  isSuccess,
  success,
  taggedError,
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

describe('assert helper', () => {
  test('does not throw when condition is true', () => {
    // Should not throw
    assertTry(true, 'should not throw')
    assertTry(1 > 0, new Error('should not throw'))
    assertTry('truthy', 'should not throw')
  })

  test('throws with string message when condition is false', () => {
    try {
      assertTry(false, 'custom error message')
      // Should not reach here
      assert.equal(true, false)
    } catch (err) {
      assert.ok(err instanceof Error)
      assert.equal((err as Error).message, 'custom error message')
    }
  })

  test('throws with Error instance when condition is false', () => {
    const customError = new Error('custom error instance')
    try {
      assertTry(false, customError)
      // Should not reach here
      assert.equal(true, false)
    } catch (err) {
      assert.equal(err, customError)
    }
  })

  test('throws with tagged error when condition is false', () => {
    const DatabaseError = taggedError('DatabaseError')
    try {
      assertTry(false, new DatabaseError('database connection failed'))
      // Should not reach here
      assert.equal(true, false)
    } catch (err) {
      assert.ok(err instanceof DatabaseError)
      assert.equal((err as InstanceType<typeof DatabaseError>)._tag, 'DatabaseError')
      assert.equal((err as Error).message, 'database connection failed')
    }
  })

  test('type narrowing works with Result types using err === undefined', () => {
    const [err, value] = goTry(() => 'success')

    // Before assert: err is string | undefined, value is string | undefined
    attest<string | undefined>(err)
    attest<string | undefined>(value)

    // Using err === undefined provides the best type narrowing
    assertTry(err === undefined, 'should have no error')

    // TypeScript now knows err is undefined and value is string
    attest<undefined>(err)
    attest<string>(value)
    assert.equal(value, 'success')
  })

  test('type narrowing works with err === undefined check', () => {
    const [err, value] = goTryRaw(() => ({ id: 1, name: 'test' }))

    // Before assert
    attest<Error | undefined>(err)
    attest<{ id: number; name: string } | undefined>(value)

    // Using err === undefined pattern
    assertTry(err === undefined, new Error('should have no error'))

    // After assert: TypeScript knows err is undefined, value is defined
    attest<{ id: number; name: string }>(value)
    assert.deepEqual(value, { id: 1, name: 'test' })
  })

  test('type narrowing works with tagged errors', () => {
    const DatabaseError = taggedError('DatabaseError')
    const [err, user] = goTryRaw(() => ({ id: '123', name: 'John' }), DatabaseError)

    // Before assert
    attest<InstanceType<typeof DatabaseError> | undefined>(err)
    attest<{ id: string; name: string } | undefined>(user)

    // Use assert with tagged error
    assertTry(err === undefined, new DatabaseError('Failed to fetch user'))

    // After assert: TypeScript knows err is undefined, user is defined
    attest<{ id: string; name: string }>(user)
    assert.deepEqual(user, { id: '123', name: 'John' })
  })

  test('reduces boilerplate compared to if(err) throw', () => {
    const DatabaseError = taggedError('DatabaseError')

    function fetchUserOldStyle(): Result<InstanceType<typeof DatabaseError>, { id: string }> {
      const [err, user] = goTryRaw(() => ({ id: '123' }), DatabaseError)
      if (err) return failure(err)  // Old style
      return [undefined, user] as const
    }

    function fetchUserNewStyle(): Result<InstanceType<typeof DatabaseError>, { id: string }> {
      const [err, user] = goTryRaw(() => ({ id: '123' }), DatabaseError)
      assertTry(err === undefined, new DatabaseError('Failed to fetch user'))
      // TypeScript now knows user is defined
      return [undefined, user] as const
    }

    const [err1, user1] = fetchUserOldStyle()
    const [err2, user2] = fetchUserNewStyle()

    assert.equal(err1, undefined)
    assert.equal(err2, undefined)
    assert.deepEqual(user1, { id: '123' })
    assert.deepEqual(user2, { id: '123' })
  })

  test('works with falsy values as condition', () => {
    // 0 is falsy - should throw
    assert.throws(() => assertTry(0, 'zero is falsy'))

    // empty string is falsy - should throw
    assert.throws(() => assertTry('', 'empty string is falsy'))

    // null is falsy - should throw
    assert.throws(() => assertTry(null, 'null is falsy'))

    // undefined is falsy - should throw
    assert.throws(() => assertTry(undefined, 'undefined is falsy'))

    // NaN is falsy - should throw
    assert.throws(() => assertTry(Number.NaN, 'NaN is falsy'))
  })

  test('works with truthy values as condition', () => {
    // non-zero number is truthy
    assertTry(1, new Error('one is truthy'))

    // non-empty string is truthy
    assertTry('hello', new Error('string is truthy'))

    // object is truthy
    assertTry({}, new Error('object is truthy'))

    // array is truthy
    assertTry([], new Error('array is truthy'))

    // true is truthy
    assertTry(true, new Error('true is truthy'))
  })

  test('works with ErrorClass and message (shorter syntax)', () => {
    const ValidationError = taggedError('ValidationError')

    // Should not throw when condition is true
    assertTry(5 > 0, ValidationError, 'Value must be positive')

    // Should throw with instantiated error when condition is false
    try {
      assertTry(-1 > 0, ValidationError, 'Value must be positive')
      assert.equal(true, false) // Should not reach here
    } catch (err) {
      assert.ok(err instanceof ValidationError)
      assert.equal((err as InstanceType<typeof ValidationError>)._tag, 'ValidationError')
      assert.equal((err as Error).message, 'Value must be positive')
    }
  })

  test('shorter syntax with tagged errors provides type narrowing', () => {
    const DatabaseError = taggedError('DatabaseError')
    const [err, user] = goTryRaw(() => ({ id: '123', name: 'John' }), DatabaseError)

    // Before assert
    attest<InstanceType<typeof DatabaseError> | undefined>(err)
    attest<{ id: string; name: string } | undefined>(user)

    // Use assert with shorter syntax
    assertTry(err === undefined, DatabaseError, 'Failed to fetch user')

    // After assert: TypeScript knows err is undefined, user is defined
    attest<undefined>(err)
    attest<{ id: string; name: string }>(user)
    assert.deepEqual(user, { id: '123', name: 'John' })
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


describe('taggedError', () => {
  test('creates error class with _tag property', () => {
    const DatabaseError = taggedError('DatabaseError')
    const err = new DatabaseError('connection failed')

    assert.equal(err._tag, 'DatabaseError')
    assert.equal(err.message, 'connection failed')
    assert.equal(err.name, 'DatabaseError')
    assert.ok(err instanceof Error)
    assert.ok(err instanceof DatabaseError)
  })

  test('supports cause option', () => {
    const NetworkError = taggedError('NetworkError')
    const cause = new Error('ECONNREFUSED')
    const err = new NetworkError('request failed', { cause })

    assert.equal(err._tag, 'NetworkError')
    assert.equal(err.message, 'request failed')
    assert.equal(err.cause, cause)
  })

  test('different error types have distinct _tag values', () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')
    const ValidationError = taggedError('ValidationError')

    const dbErr = new DatabaseError('db fail')
    const netErr = new NetworkError('net fail')
    const valErr = new ValidationError('val fail')

    assert.equal(dbErr._tag, 'DatabaseError')
    assert.equal(netErr._tag, 'NetworkError')
    assert.equal(valErr._tag, 'ValidationError')
  })

  test('works with goTryRaw for discriminated error handling', async () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')

    // Simulate a database operation that might fail
    const fetchFromDb = () => {
      throw new DatabaseError('query failed')
    }

    // Simulate a network request that might fail
    const fetchFromNetwork = () => {
      throw new NetworkError('timeout')
    }

    // Wrap in functions so goTryRaw can catch the errors
    const [dbErr, dbResult] = goTryRaw(fetchFromDb, DatabaseError)
    const [netErr, netResult] = goTryRaw(fetchFromNetwork, NetworkError)

    // Type narrowing via discriminated union
    if (dbErr) {
      assert.equal(dbErr._tag, 'DatabaseError')
      assert.equal(dbErr.message, 'query failed')
    }

    if (netErr) {
      assert.equal(netErr._tag, 'NetworkError')
      assert.equal(netErr.message, 'timeout')
    }

    assert.equal(dbResult, undefined)
    assert.equal(netResult, undefined)
  })

  test('can return union of error types from function', async () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')

    type AppError = InstanceType<typeof DatabaseError> | InstanceType<typeof NetworkError>

    async function fetchUser(id: string): Promise<Result<AppError, { id: string; name: string }>> {
      const [dbErr, user] = await goTryRaw(
        Promise.resolve({ id, name: 'John' }),
        DatabaseError,
      )
      if (dbErr) return failure<AppError>(dbErr)
      return [undefined, user] as const
    }

    async function fetchData(): Promise<Result<AppError, string>> {
      const [netErr, data] = await goTryRaw(Promise.resolve('data'), NetworkError)
      if (netErr) return failure<AppError>(netErr)
      return [undefined, data] as const
    }

    // Use the functions
    const [userErr, user] = await fetchUser('123')
    const [, data] = await fetchData()

    // Type narrowing works with discriminated unions
    if (userErr) {
      // userErr._tag can be 'DatabaseError' | 'NetworkError'
      assert.ok(userErr._tag === 'DatabaseError' || userErr._tag === 'NetworkError')
    }

    assert.deepEqual(user, { id: '123', name: 'John' })
    assert.equal(data, 'data')
  })

  test('pattern matching on error types', async () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')
    const ValidationError = taggedError('ValidationError')

    type AppError =
      | InstanceType<typeof DatabaseError>
      | InstanceType<typeof NetworkError>
      | InstanceType<typeof ValidationError>

    function handleError(err: AppError): string {
      switch (err._tag) {
        case 'DatabaseError':
          return `DB: ${err.message}`
        case 'NetworkError':
          return `NET: ${err.message}`
        case 'ValidationError':
          return `VAL: ${err.message}`
        default:
          return assertNever(err)
      }
    }

    assert.equal(handleError(new DatabaseError('fail')), 'DB: fail')
    assert.equal(handleError(new NetworkError('timeout')), 'NET: timeout')
    assert.equal(handleError(new ValidationError('invalid')), 'VAL: invalid')
  })

  test('exhaustive switch with never type', () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')
    const ValidationError = taggedError('ValidationError')

    type AppError = TaggedUnion<[typeof DatabaseError, typeof NetworkError, typeof ValidationError]>

    // Exhaustive switch - TypeScript will error if any case is missing
    function handleErrorExhaustive(err: AppError): string {
      switch (err._tag) {
        case 'DatabaseError':
          return `DB: ${err.message}`
        case 'NetworkError':
          return `NET: ${err.message}`
        case 'ValidationError':
          return `VAL: ${err.message}`
        default:
          // This ensures all cases are handled - if we forget a case above,
          // err will not be never and TypeScript will error
          return assertNever(err)
      }
    }

    assert.equal(handleErrorExhaustive(new DatabaseError('fail')), 'DB: fail')
    assert.equal(handleErrorExhaustive(new NetworkError('timeout')), 'NET: timeout')
    assert.equal(handleErrorExhaustive(new ValidationError('invalid')), 'VAL: invalid')
  })
})

describe('taggedError type tests', () => {
  test('error class has correct type structure', () => {
    const DatabaseError = taggedError('DatabaseError')
    const err = new DatabaseError('fail')

    // The error should have _tag, message, and cause properties
    attest<'DatabaseError'>(err._tag)
    attest<string>(err.message)
    attest<unknown | undefined>(err.cause)
    // Error instance check - the class extends Error
    assert.ok(err instanceof Error)
  })

  test('discriminated union type narrowing works', () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')

    type AppError = InstanceType<typeof DatabaseError> | InstanceType<typeof NetworkError>

    const err: AppError = new DatabaseError('fail')

    // Type narrowing via _tag
    if (err._tag === 'DatabaseError') {
      attest<InstanceType<typeof DatabaseError>>(err)
    } else {
      attest<InstanceType<typeof NetworkError>>(err)
    }
  })
})


describe('TaggedUnion type helper', () => {
  test('creates union type from multiple error classes', () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')
    const ValidationError = taggedError('ValidationError')

    // Create union type using helper
    type AppError = TaggedUnion<[typeof DatabaseError, typeof NetworkError, typeof ValidationError]>

    // All error types should be assignable to AppError
    const dbErr: AppError = new DatabaseError('db fail')
    const netErr: AppError = new NetworkError('net fail')
    const valErr: AppError = new ValidationError('val fail')

    assert.equal(dbErr._tag, 'DatabaseError')
    assert.equal(netErr._tag, 'NetworkError')
    assert.equal(valErr._tag, 'ValidationError')

    // Pattern matching should work
    function handleError(err: AppError): string {
      switch (err._tag) {
        case 'DatabaseError':
          return `DB: ${err.message}`
        case 'NetworkError':
          return `NET: ${err.message}`
        case 'ValidationError':
          return `VAL: ${err.message}`
        default:
          return assertNever(err)
      }
    }

    assert.equal(handleError(dbErr), 'DB: db fail')
    assert.equal(handleError(netErr), 'NET: net fail')
    assert.equal(handleError(valErr), 'VAL: val fail')
  })

  test('works with goTryRaw for typed error handling', async () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')

    type AppError = TaggedUnion<[typeof DatabaseError, typeof NetworkError]>

    async function fetchData(): Promise<Result<AppError, string>> {
      const [err, data] = await goTryRaw(
        Promise.reject(new Error('timeout')),
        NetworkError,
      )
      if (err) return failure<AppError>(err)
      return [undefined, data] as const
    }

    const [err, data] = await fetchData()
    assert.equal(data, undefined)
    assert.equal(err?._tag, 'NetworkError')
    assert.equal(err?.message, 'timeout')
  })
})


describe('inferred return types with tagged errors', () => {
  test('function infers union return type without explicit annotation', async () => {
    const DatabaseError = taggedError('DatabaseError')
    const NetworkError = taggedError('NetworkError')

    // No explicit return type - TypeScript should infer it
    async function fetchUserData(id: string) {
      // First operation might fail with DatabaseError
      const [dbErr, user] = await goTryRaw(
        Promise.resolve({ id, name: 'John' }),
        DatabaseError,
      )
      if (dbErr) return failure(dbErr)

      // Second operation might fail with NetworkError
      const [netErr, enriched] = await goTryRaw(
        Promise.resolve({ ...user!, email: 'john@example.com' }),
        NetworkError,
      )
      if (netErr) return failure(netErr)

      return [undefined, enriched] as const
    }

    // The return type should be inferred as:
    // Promise<Result<DatabaseError | NetworkError, { id: string; name: string; email: string }>>

    const [err, user] = await fetchUserData('123')

    // Type narrowing should work
    if (err) {
      // err should be DatabaseError | NetworkError
      switch (err._tag) {
        case 'DatabaseError':
          assert.equal(err._tag, 'DatabaseError')
          break
        case 'NetworkError':
          assert.equal(err._tag, 'NetworkError')
          break
        default:
          assertNever(err)
      }
    } else {
      // user should be fully typed
      assert.deepEqual(user, { id: '123', name: 'John', email: 'john@example.com' })
    }
  })

  test('sync function infers union return type', () => {
    const ParseError = taggedError('ParseError')
    const ValidateError = taggedError('ValidateError')

    // No explicit return type annotation
    function processConfig(input: string) {
      // Parse step
      const [parseErr, parsed] = goTryRaw(() => JSON.parse(input), ParseError)
      if (parseErr) return failure(parseErr)

      // Validate step
      const [validateErr, validated] = goTryRaw(() => {
        if (!parsed!.port) throw new Error('Missing port')
        return parsed as { port: number }
      }, ValidateError)
      if (validateErr) return failure(validateErr)

      return [undefined, validated] as const
    }

    // Success case
    const [err1, config1] = processConfig('{"port": 3000}')
    assert.equal(err1, undefined)
    assert.deepEqual(config1, { port: 3000 })

    // Parse error case
    const [err2, config2] = processConfig('invalid json')
    assert.equal(err2?._tag, 'ParseError')
    assert.equal(config2, undefined)

    // Validation error case
    const [err3, config3] = processConfig('{"host": "localhost"}')
    assert.equal(err3?._tag, 'ValidateError')
    assert.equal(config3, undefined)
  })

  test('multiple error sources collapse to union type', async () => {
    const ErrorA = taggedError('ErrorA')
    const ErrorB = taggedError('ErrorB')
    const ErrorC = taggedError('ErrorC')

    // Function with multiple potential error sources
    async function complexOperation(shouldFail: 'a' | 'b' | 'c' | 'none') {
      const [errA, valA] = await goTryRaw(
        shouldFail === 'a' ? Promise.reject(new Error('a')) : Promise.resolve('step1'),
        ErrorA,
      )
      if (errA) return failure(errA)

      const [errB, valB] = await goTryRaw(
        shouldFail === 'b' ? Promise.reject(new Error('b')) : Promise.resolve('step2'),
        ErrorB,
      )
      if (errB) return failure(errB)

      const [errC, valC] = await goTryRaw(
        shouldFail === 'c' ? Promise.reject(new Error('c')) : Promise.resolve('step3'),
        ErrorC,
      )
      if (errC) return failure(errC)

      return success({ valA, valB, valC })
    }

    // All cases should be handled with exhaustive switch
    async function handleOperation(shouldFail: 'a' | 'b' | 'c' | 'none') {
      const [err, result] = await complexOperation(shouldFail)

      if (err) {
        // TypeScript should infer err as ErrorA | ErrorB | ErrorC
        switch (err._tag) {
          case 'ErrorA':
            return `Failed at step A: ${err.message}`
          case 'ErrorB':
            return `Failed at step B: ${err.message}`
          case 'ErrorC':
            return `Failed at step C: ${err.message}`
          default:
            return assertNever(err)
        }
      }

      return `Success: ${JSON.stringify(result)}`
    }

    assert.equal(await handleOperation('a'), 'Failed at step A: a')
    assert.equal(await handleOperation('b'), 'Failed at step B: b')
    assert.equal(await handleOperation('c'), 'Failed at step C: c')
    assert.equal(
      await handleOperation('none'),
      'Success: {"valA":"step1","valB":"step2","valC":"step3"}',
    )
  })
})
