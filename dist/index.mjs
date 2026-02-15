function isSuccess(result) {
  return result[0] === void 0;
}
function isFailure(result) {
  return result[0] !== void 0;
}
function success(value) {
  return [void 0, value];
}
function failure(error) {
  return [error, void 0];
}
function assertNever(value) {
  throw new Error(`Unhandled case: ${String(value)}`);
}

function getErrorMessage(error) {
  if (error === void 0) return "undefined";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
function isPromise(value) {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}
function isError(value) {
  return value instanceof Error;
}
function resolveDefault(defaultValue) {
  return typeof defaultValue === "function" ? defaultValue() : defaultValue;
}

function goTry(value) {
  try {
    const result = typeof value === "function" ? value() : value;
    if (isPromise(result)) {
      return result.then((resolvedValue) => success(resolvedValue)).catch((err) => failure(getErrorMessage(err)));
    }
    return success(result);
  } catch (err) {
    return failure(getErrorMessage(err));
  }
}

function goTryRaw(value, ErrorClass) {
  const wrapError = (err) => {
    if (ErrorClass) {
      if (err === void 0) {
        return new ErrorClass("undefined");
      }
      if (isError(err)) {
        return new ErrorClass(err.message, { cause: err });
      }
      return new ErrorClass(String(err));
    }
    if (err === void 0) {
      return new Error("undefined");
    }
    return isError(err) ? err : new Error(String(err));
  };
  try {
    const result = typeof value === "function" ? value() : value;
    if (isPromise(result)) {
      return result.then((resolvedValue) => success(resolvedValue)).catch((err) => failure(wrapError(err)));
    }
    return success(result);
  } catch (err) {
    return failure(wrapError(err));
  }
}

function goTryOr(value, defaultValue) {
  try {
    const result = typeof value === "function" ? value() : value;
    if (isPromise(result)) {
      return result.then((resolvedValue) => success(resolvedValue)).catch((err) => [getErrorMessage(err), resolveDefault(defaultValue)]);
    }
    return success(result);
  } catch (err) {
    return [getErrorMessage(err), resolveDefault(defaultValue)];
  }
}

async function runWithConcurrency(items, concurrency) {
  if (items.length === 0) {
    return [];
  }
  const isFactoryMode = typeof items[0] === "function";
  if (!isFactoryMode && concurrency <= 0) {
    return Promise.allSettled(items);
  }
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      try {
        const item = items[currentIndex];
        const value = isFactoryMode ? await item() : await item;
        results[currentIndex] = { status: "fulfilled", value };
      } catch (reason) {
        results[currentIndex] = { status: "rejected", reason };
      }
    }
  }
  const workerCount = concurrency <= 0 ? items.length : Math.min(concurrency, items.length);
  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}
async function goTryAll(items, options) {
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0);
  const errors = [];
  const results = [];
  for (let i = 0; i < settled.length; i++) {
    const item = settled[i];
    if (item.status === "fulfilled") {
      errors[i] = void 0;
      results[i] = item.value;
    } else {
      errors[i] = getErrorMessage(item.reason);
      results[i] = void 0;
    }
  }
  return [errors, results];
}
async function goTryAllRaw(items, options) {
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0);
  const errors = [];
  const results = [];
  for (let i = 0; i < settled.length; i++) {
    const item = settled[i];
    if (item.status === "fulfilled") {
      errors[i] = void 0;
      results[i] = item.value;
    } else {
      const reason = item.reason;
      errors[i] = isError(reason) ? reason : new Error(String(reason));
      results[i] = void 0;
    }
  }
  return [errors, results];
}

function taggedError(tag) {
  return class TaggedErrorClass extends Error {
    constructor(message, options) {
      super(message);
      this._tag = tag;
      this.name = tag;
      this.cause = options?.cause;
    }
  };
}

function assert(condition, errorOrClass, message) {
  if (!condition) {
    if (typeof errorOrClass === "string") {
      throw new Error(errorOrClass);
    }
    if (typeof errorOrClass === "function" && message !== void 0) {
      throw new errorOrClass(message);
    }
    throw errorOrClass;
  }
}

export { assert, assertNever, failure, goTry, goTryAll, goTryAllRaw, goTryOr, goTryRaw, isFailure, isSuccess, success, taggedError };
