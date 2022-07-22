# `good-try`

> Tries to execute sync/async function, returns a specified default value if the function throws.

[![Gzipped Size](https://img.shields.io/bundlephobia/minzip/good-try)](https://bundlephobia.com/result?p=good-try)
[![Build Status](https://img.shields.io/github/workflow/status/astoilkov/good-try/CI)](https://github.com/astoilkov/good-try/actions/workflows/main.yml)

## Why

Why not [`nice-try`](https://github.com/electerious/nice-try) with it's 70+ million downloads per month?
- `good-try` supports async functions.
- `good-try` supports an optional default value.
- `good-try` allows you to capture the thrown error.
- `good-try` is written in TypeScript and the types are in a way to reduce developer errors. For example, I sometimes incorrectly type `goodTry(readFileSync())`, but the types don't allow this.
- `good-try` has a friend — [`settle-it`](https://github.com/astoilkov/settle-it).

## Install

```bash
npm install good-try
```

## Usage

```ts
import goodTry from 'good-try'

// tries to parse todos, returns empty array if it fails
const value = goodTry(() => JSON.parse(todos), [])

// fetch todos, on error, fallback to empty array
const todos = await goodTry(fetchTodos(), [])

// fetch todos, fallback to empty array, send error to your error tracking service
const todos = await goodTry(fetchTodos(), (err) => {
    sentToErrorTrackingService(err)
    return []  
})
```

## API

**First parameter** accepts:
- synchronous function `goodTry(() => JSON.parse(value))`
- asynchronous function / Promise
- synchronous function that returns a promise

**Second parameter** accepts:
- any value that will be returned if the first parameter throws
- a callback that receives `err` as first parameter (the return value of the callback is returned if the first parameter throws)

If you use TypeScript, the types are well defined and won't let you make a mistake.

## Related

- [settle-it](https://github.com/astoilkov/settle-it) – Like `Promise.allSettled()` but for sync and async functions. Similarly to `good-try` it handles sync/async functions that throw an error. However, it returns an object so you know if and what error was thrown.