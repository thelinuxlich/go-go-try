# `good-try`

> Tries to execute a sync/async function, returns a specified default value if the function throws.

[![Gzipped Size](https://img.shields.io/bundlephobia/minzip/good-try)](https://bundlephobia.com/result?p=good-try)
[![Build Status](https://img.shields.io/github/workflow/status/astoilkov/good-try/CI)](https://github.com/astoilkov/good-try/actions/workflows/main.yml)

## Why

Why not [`nice-try`](https://github.com/electerious/nice-try) with it's 70+ million downloads per month?
- `good-try` supports async functions.
- `good-try` supports an optional default value.
- `good-try` allows you to capture the thrown error.
- `good-try` is written in TypeScript. The types are written in a way that reduce developer errors. For example, I sometimes incorrectly type `goodTry(readFileSync())`, but the types don't allow this.
- `good-try` has a friend — [`settle-it`](https://github.com/astoilkov/settle-it).
- I aim for high-quality with [my open-source principles](https://astoilkov.com/my-open-source-principles).

Why not just `try`/`catch`?
- In a lot of cases, `try`/`catch` is still the better option.
- Nested `try`/`catch` statements are hard to process mentally. They also indent the code and make it hard to read. A single `try`/`catch` does the same but to a lesser degree.
- If you [prefer const](https://eslint.org/docs/latest/rules/prefer-const), `try`/`catch` statements get in the way because you need to use `let` if you need the variable outside of the `try`/`catch` scope:
  ```ts
  let todos;
  try {
      todos = JSON.parse(localStorage.getItem('todos'))
  } catch {}
  return todos.filter(todo => todo.done)
  ```
- It takes more space. It's slower to type.

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