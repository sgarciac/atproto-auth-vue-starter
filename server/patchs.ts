// We need to monkey patch the `fetch` definition because Cloudflare's implementation
// does not support the `redirect: "error"` option, which is used by the official atproto
// libs.
//
// See cloudflare's explanation here:
//
// > Invalid redirect value, must be one of "follow" or "manual" ("error" won't be implemented since
// > it does not make sense at the edge; use "manual" and check the response status code).

export function patchBase() {
  const originalFetch = globalThis.fetch;
  const fetchManualResult = async (
    url: RequestInfo<unknown, CfProperties<unknown>> | URL,
    init?: RequestInit
  ) => {
    const throwOnRedirect = init?.redirect === "error";
    // also remove cache option?
    if (throwOnRedirect) {
      const result = await originalFetch(url, {
        ...init,
        redirect: "manual",
      });
      if (result.redirected) {
        throw new Error("Redirected when it shouldn't");
      }

      return result;
    } else {
      return originalFetch(url, init);
    }
  };

  globalThis.fetch = fetchManualResult;

  const originalRequest = Request;
  //@ts-ignore
  globalThis.Request = function (url, init) {
    const modifiedInit = { ...init };
    if (init?.redirect === "error") {
      modifiedInit.redirect = "manual";
    }
    if (init?.cache === "no-cache") {
      modifiedInit.cache = "no-store";
    }
    return new originalRequest(url, modifiedInit);
  };
  // finish monkey patching
}
