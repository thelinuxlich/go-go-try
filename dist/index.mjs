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
function goTryRaw(value) {
  try {
    const result = typeof value === "function" ? value() : value;
    if (isPromise(result)) {
      return result.then((resolvedValue) => success(resolvedValue)).catch((err) => {
        if (err === void 0) {
          return failure(new Error("undefined"));
        }
        return failure(
          isError(err) ? err : new Error(String(err))
        );
      });
    }
    return success(result);
  } catch (err) {
    return failure(
      isError(err) ? err : new Error(String(err))
    );
  }
}

export { failure, goTry, goTryRaw, isFailure, isSuccess, success };
