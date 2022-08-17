const confusingBrowserGlobals = require('confusing-browser-globals')

module.exports = {
    parser: '@typescript-eslint/parser',

    extends: [
        'strictest/eslint',
        'strictest/promise',
        'strictest/typescript-eslint',
        'strictest/unicorn',
    ],

    plugins: ['promise', '@typescript-eslint', 'unicorn'],

    parserOptions: {
        // enables the use of `import { a } from b` syntax. required for TypeScript imports
        sourceType: 'module',

        project: './tsconfig.json',
    },

    env: {
        es6: true,
        browser: true,
    },

    rules: {
        'no-restricted-globals': ['error', ...confusingBrowserGlobals],
        '@typescript-eslint/promise-function-async': 0,
        'promise/prefer-await-to-then': 0,
    },
}
