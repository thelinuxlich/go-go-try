import { goTry, goExpect } from './index'

describe('go-go-try', () => {
    it(`value returned by callback is used when callback doesn't throw`, async () => {
        const fn = () => 'value'
        const [err1, value] = goTry(fn)
        let value2
        try {
            value2 = await goExpect(fn)
        } catch (err) {
            // this won't throw
        }

        expect(value).toBe('value')
        expect(value2).toBe('value')
        expect(err1).toBeUndefined()
    })

    it('if callback throws, value should be undefined and err should contain the error message', async () => {
        const fn = () => {
            return JSON.parse('{/')
        }
        const [err1, value] = goTry(fn)

        let value2, err2
        try {
            value2 = await goExpect(fn)
        } catch (err) {
            if (err instanceof Error) {
                err2 = err.message
            }
        }

        expect(value).toBeUndefined()
        expect(value2).toBeUndefined()
        expect(typeof err1).toBe('string')
        expect(typeof err2).toBe('string')
    })

    it('first parameter accepts promises and makes the function async', async () => {
        const fn = Promise.resolve('value')
        const [err1, value] = await goTry(fn)
        let value2, err2
        try {
            value2 = await goExpect(fn)
        } catch (err) {
            err2 = err
        }
        expect(value).toBe('value')
        expect(value2).toBe('value')
        expect(err1).toBeUndefined()
        expect(err2).toBeUndefined()
    })

    it('if async callback throws, value should be undefined and err should contain the error message', async () => {
        const fn = Promise.reject(new Error('error'))
        const [err, value] = await goTry(fn)
        let value2, err2
        try {
            value2 = await goExpect(fn, (e) => `custom ${e}`)
        } catch (err) {
            if (err instanceof Error) {
                err2 = err.message
                console.log(err)
            }
        }
        expect(value).toBeUndefined()
        expect(value2).toBeUndefined()
        expect(err).toBe('error')
        expect(err2).toBe('custom error')
    })
})
