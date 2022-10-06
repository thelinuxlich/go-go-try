import goTry from './index'

describe('go-go-try', () => {
    it(`value returned by callback is used when callback doesn't throw`, () => {
        const [err, value] = goTry(() => 'value')

        expect(value).toBe('value')
        expect(err).toBeUndefined()
    })

    it('if callback throws, value should be undefined and err should contain the error message', () => {
        const [err, value] = goTry(() => {
            return JSON.parse('{/')
        })

        expect(value).toBeUndefined()
        expect(typeof err).toBe('string')
    })

    it('first parameter accepts promises and makes the function async', async () => {
        const [err, value] = await goTry(Promise.resolve('value'))

        expect(value).toBe('value')
        expect(err).toBeUndefined()
    })

    it('if async callback throws, value should be undefined and err should contain the error message', async () => {
        const [err, value] = await goTry(Promise.reject(new Error('error')))

        expect(value).toBeUndefined()
        expect(err).toBe('error')
    })
})
