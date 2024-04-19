import pIsPromise from 'p-is-promise';

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
function isPromise(p) {
  return pIsPromise(p);
}
function goTry(value) {
  let unwrappedValue;
  try {
    unwrappedValue = typeof value === "function" ? value() : value;
    if (isPromise(unwrappedValue)) {
      return Promise.resolve(unwrappedValue).then((value2) => [void 0, value2]).catch((err) => [getErrorMessage(err), void 0]);
    }
    return [void 0, unwrappedValue];
  } catch (err) {
    return [getErrorMessage(err), void 0];
  }
}
function goTryRaw(value) {
  let unwrappedValue;
  try {
    unwrappedValue = typeof value === "function" ? value() : value;
    if (isPromise(unwrappedValue)) {
      return Promise.resolve(unwrappedValue).then((value2) => [void 0, value2]).catch((err) => [err, void 0]);
    }
    return [void 0, unwrappedValue];
  } catch (err) {
    return [err, void 0];
  }
}
async function goExpect(value, error) {
  const _error = error ?? ((e) => e);
  try {
    const unwrappedValue = typeof value === "function" ? value() : value;
    if (isPromise(unwrappedValue)) {
      const [err, res] = await goTry(unwrappedValue);
      if (err !== void 0) {
        throw new Error(err);
      }
      return res;
    }
    return unwrappedValue;
  } catch (err) {
    throw new Error(_error(getErrorMessage(err)));
  }
}

export { goExpect, goTry, goTryRaw };
