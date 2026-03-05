// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { ensureSessionKey } from "@/lib/api";

const clearSessionCookie = () => {
  document.cookie = "sessionid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

describe("ensureSessionKey", () => {
  afterEach(() => {
    clearSessionCookie();
    vi.restoreAllMocks();
  });

  it("bootstraps a session when cookie is missing", async () => {
    clearSessionCookie();
    const fetchMock = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ detail: "Session initialized", session_key: "bootstrapped-session" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const sessionKey = await ensureSessionKey();

    expect(sessionKey).toBe("bootstrapped-session");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/auth/session");
  });

  it("returns existing session without bootstrapping", async () => {
    document.cookie = "sessionid=existing-session; path=/";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const sessionKey = await ensureSessionKey();

    expect(sessionKey).toBe("existing-session");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
