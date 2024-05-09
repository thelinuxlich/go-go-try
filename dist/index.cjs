'use strict';

function isErrorWithMessage(error) {
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string";
}
function toErrorWithMessage(maybeError) {
  if (isErrorWithMessage(maybeError)) {
    return maybeError;
  }
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}
function getErrorMessage(error) {
  return toErrorWithMessage(error).message;
}
function goTry(value) {
  return Promise.resolve(value).then((value2) => [void 0, value2]).catch((err) => [getErrorMessage(err), void 0]);
}
function goTrySync(value) {
  try {
    return [void 0, value()];
  } catch (err) {
    return [getErrorMessage(err), void 0];
  }
}
function goTryRaw(value) {
  return Promise.resolve(value).then((value2) => [void 0, value2]).catch((err) => [err, void 0]);
}
function goTryRawSync(value) {
  try {
    return [void 0, value()];
  } catch (err) {
    return [err, void 0];
  }
}

exports.goTry = goTry;
exports.goTryRaw = goTryRaw;
exports.goTryRawSync = goTryRawSync;
exports.goTrySync = goTrySync;
