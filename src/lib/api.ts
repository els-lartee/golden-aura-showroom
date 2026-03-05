const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiError = {
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
};

let csrfTokenCache = "";

export const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
};

export const getSessionKey = () => getCookieValue("sessionid");

export const ensureSessionKey = async () => {
  const existingSessionKey = getSessionKey();
  if (existingSessionKey) return existingSessionKey;
  const data = await apiFetch<{ detail: string; session_key?: string }>("/auth/session", {
    method: "GET",
  });
  return data.session_key || getSessionKey();
};

/**
 * Extract a human-readable message from a DRF error response body.
 * DRF returns errors in several shapes:
 *   - { "detail": "..." }                        → single message
 *   - { "field": ["error1", ...], ... }           → field validation errors
 *   - { "non_field_errors": ["..."] }             → form-level errors
 *   - ["error1", ...]                             → list of messages
 */
const parseErrorBody = (data: unknown): { message: string; fieldErrors?: Record<string, string[]> } => {
  if (!data) return { message: "Request failed" };

  // String response
  if (typeof data === "string") return { message: data };

  // Array of messages  e.g. ["error1", "error2"]
  if (Array.isArray(data)) {
    return { message: data.map(String).join(". ") };
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // { detail: "..." } or { detail: { message: "..." } }
    if (obj.detail) {
      if (typeof obj.detail === "string") return { message: obj.detail };
      if (typeof obj.detail === "object" && (obj.detail as Record<string, unknown>)?.message) {
        return { message: String((obj.detail as Record<string, unknown>).message) };
      }
    }

    // { non_field_errors: ["..."] }
    if (Array.isArray(obj.non_field_errors)) {
      return { message: obj.non_field_errors.map(String).join(". ") };
    }

    // Field-level errors: { field: ["error", ...], ... }
    const fieldErrors: Record<string, string[]> = {};
    const messages: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        const msgs = value.map(String);
        fieldErrors[key] = msgs;
        const label = key.replace(/_/g, " ");
        messages.push(`${label}: ${msgs.join(", ")}`);
      } else if (typeof value === "string") {
        fieldErrors[key] = [value];
        const label = key.replace(/_/g, " ");
        messages.push(`${label}: ${value}`);
      }
    }
    if (messages.length > 0) {
      return { message: messages.join(". "), fieldErrors };
    }
  }

  return { message: "Request failed" };
};

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

const getCsrfToken = () => {
  return getCookieValue("csrftoken");
};

const ensureCsrfCookie = async () => {
  if (csrfTokenCache) return csrfTokenCache;
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    csrfTokenCache = csrfToken;
    return csrfToken;
  }
  const response = await fetch(buildUrl("/auth/csrf"), {
    method: "GET",
    credentials: "include",
  });
  const tokenFromCookie = getCsrfToken();
  if (tokenFromCookie) {
    csrfTokenCache = tokenFromCookie;
    return tokenFromCookie;
  }
  const data = await response.json().catch(() => null);
  const tokenFromBody = data?.csrfToken || "";
  csrfTokenCache = tokenFromBody;
  return tokenFromBody;
};

const apiFetch = async <T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; params?: Record<string, string | number | undefined> } = {}
): Promise<T> => {
  const { method = "GET", body, params } = options;
  const needsCsrf = method !== "GET";
  const csrfToken = needsCsrf ? await ensureCsrfCookie() : getCsrfToken();
  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let parsed = { message: "Request failed" } as ReturnType<typeof parseErrorBody>;
    try {
      const data = await response.json();
      parsed = parseErrorBody(data);
    } catch {
      parsed = { message: response.statusText || "Request failed" };
    }
    throw { message: parsed.message, status: response.status, fieldErrors: parsed.fieldErrors } as ApiError;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

const apiUpload = async <T>(
  path: string,
  body: FormData,
  method: "POST" | "PUT" | "PATCH" = "POST"
): Promise<T> => {
  const csrfToken = await ensureCsrfCookie();
  const response = await fetch(buildUrl(path), {
    method,
    credentials: "include",
    headers: {
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    },
    body,
  });

  if (!response.ok) {
    let parsed = { message: "Request failed" } as ReturnType<typeof parseErrorBody>;
    try {
      const data = await response.json();
      parsed = parseErrorBody(data);
    } catch {
      parsed = { message: response.statusText || "Request failed" };
    }
    throw { message: parsed.message, status: response.status, fieldErrors: parsed.fieldErrors } as ApiError;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    apiFetch<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, body: FormData, method: "POST" | "PUT" | "PATCH" = "POST") =>
    apiUpload<T>(path, body, method),
};

export default API_BASE_URL;
