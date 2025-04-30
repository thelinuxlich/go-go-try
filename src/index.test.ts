import { attest } from '@ark/attest'
import { assert, describe, test } from 'vitest'
import { type Result, goTry, goTryRaw, isFailure, isSuccess } from './index.js'

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
