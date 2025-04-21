import * as assert from 'node:assert'
import { test } from 'node:test'
import { goTry, goTryRaw, isFailure, isSuccess } from './src/index.js'

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

test('if callback throws, value should be undefined and err should contain the error message', async () => {
  const fn = () => {
    return JSON.parse('{/') as string
  }

  // Test with function that throws
  const result1 = goTry(fn)
  const result2 = goTryRaw<Error>(fn)

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
