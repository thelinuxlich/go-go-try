import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',

    // 🐛 fix "having test.js and test.ts doesn't work"
    // what about: ts-node CLI option:
    // --prefer-ts-exts Re-order file extensions so that TypeScript imports are preferred (TS_NODE_PREFER_TS_EXTS, default: false)
    moduleNameMapper: {
        '^(\\..*)$': ['$1/index.ts', '$1.ts', '$1'],
    },

    // run tests on root and in /test folder with .ts and .tsx extensions
    testMatch: ['<rootDir>/test.ts?(x)', '<rootDir>/test/**.ts?(x)'],

    // ESM support
    // https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],

    // https://jestjs.io/docs/configuration#restoremocks-boolean
    restoreMocks: true,
}

export default config
