const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiError = {
  message: string;
  status: number;
};

let csrfTokenCache = "";

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
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : "";
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
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data?.detail || message;
    } catch {
      message = response.statusText || message;
    }
    throw { message, status: response.status } as ApiError;
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
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data?.detail || message;
    } catch {
      message = response.statusText || message;
    }
    throw { message, status: response.status } as ApiError;
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
