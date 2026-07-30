import { describe, expect, it } from "vitest";
import { authorizeRequest } from "./auth";

describe("authorizeRequest", () => {
  it("accepts a matching x-api-key", () => {
    expect(authorizeRequest({ "x-api-key": "secret" }, "secret")).toEqual({ ok: true });
  });

  it("is case-insensitive on the header name", () => {
    expect(authorizeRequest({ "X-Api-Key": "secret" }, "secret")).toEqual({ ok: true });
  });

  it("rejects a wrong key with 401", () => {
    const result = authorizeRequest({ "x-api-key": "wrong" }, "secret");
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects a missing header with 401", () => {
    const result = authorizeRequest({}, "secret");
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("reports 500 when the server has no key configured", () => {
    const result = authorizeRequest({ "x-api-key": "anything" }, undefined);
    expect(result).toMatchObject({ ok: false, status: 500 });
  });
});
