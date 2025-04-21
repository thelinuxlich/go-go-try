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
function isPromiseLike(value) {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}
function goTry(value) {
  if (isPromiseLike(value)) {
    return Promise.resolve(value).then((value2) => success(value2)).catch((err) => failure(getErrorMessage(err)));
  }
  try {
    const result = typeof value === "function" ? value() : value;
    return success(result);
  } catch (err) {
    return failure(getErrorMessage(err));
  }
}
function goTryRaw(value) {
  if (isPromiseLike(value)) {
    return Promise.resolve(value).then((value2) => success(value2)).catch((err) => failure(err));
  }
  try {
    const result = typeof value === "function" ? value() : value;
    return success(result);
  } catch (err) {
    return failure(err);
  }
}

export { failure, goTry, goTryRaw, isFailure, isSuccess, success };
