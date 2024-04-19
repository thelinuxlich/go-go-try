import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
	// adds support for tests written in TypeScript
	preset: 'ts-jest',

	// adds jsdom (https://github.com/jsdom/jsdom) APIs to tests
	testEnvironment: 'jsdom',

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

	// restores original implementation (after each test is finished) when calling `jest.spyOn()`
	// inside of a test:
	// - https://jestjs.io/docs/configuration#restoremocks-boolean
	// - https://jestjs.io/docs/mock-function-api#mockfnmockrestore
	restoreMocks: true,

	// 🐛 fix "having test.js and test.ts runs the test.js file"
	// what about: ts-node CLI option:
	// --prefer-ts-exts Re-order file extensions so that TypeScript imports are preferred (TS_NODE_PREFER_TS_EXTS, default: false)
	moduleNameMapper: {
		'^(\\..*)$': ['$1/index.ts', '$1.ts', '$1'],
	},
}

export default config
