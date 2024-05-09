import assert from 'node:assert'
import test from 'node:test'
import { goTry, goTryRaw, goTryRawSync, goTrySync } from './src/index'

test(`value returned by callback is used when callback doesn't throw`, async () => {
	const fn = () => 'value'
	const [err1, value] = goTrySync(fn)
	const [err2, value2] = goTryRawSync(fn)
	assert.equal(value, 'value')
	assert.equal(value2, 'value')
	assert.equal(err1, undefined)
	assert.equal(err2, undefined)
})

test('if callback throws, value should be undefined and err should contain the error message', async () => {
	const fn = () => {
		return JSON.parse('{/') as string
	}
	const [err1, value] = goTrySync(fn)
	// add the Error type to the tuple so it's not unknown anymore
	const [err2, value2] = goTryRawSync<Error>(fn)

	assert.equal(value, undefined)
	assert.equal(value2, undefined)
	assert.equal(typeof err1, 'string')
	assert.equal(typeof err2, 'object')
	assert.equal(typeof err2?.message, 'string')
})

test('first parameter accepts promises and makes the function async', async () => {
	const fn = Promise.resolve('value')
	const [err1, value] = await goTry(fn)
	const [err2, value2] = await goTryRaw(fn)

	assert.equal(value, 'value')
	assert.equal(value2, 'value')
	assert.equal(err1, undefined)
	assert.equal(err2, undefined)
})

test('if async callback throws, value should be undefined and err should contain the error message', async () => {
	const fn = Promise.reject(new Error('error'))
	const [err, value] = await goTry(fn)
	// add the Error type to the tuple so it's not unknown anymore
	const [err2, value2] = await goTryRaw<Error>(fn)

	assert.equal(value, undefined)
	assert.equal(value2, undefined)
	assert.equal(err, 'error')
	assert.equal(typeof err2, 'object')
	assert.equal(err2?.message, 'error')
})
