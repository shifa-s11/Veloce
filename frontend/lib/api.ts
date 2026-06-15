const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

interface RequestOptions extends RequestInit {
  json?: any;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function getStoredToken(key: "accessToken" | "refreshToken"): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<any> {
  const url = `${API_URL}${path}`;

  if (!options.headers) {
    options.headers = {};
  }

  if (options.json) {
    options.body = JSON.stringify(options.json);
    (options.headers as any)["Content-Type"] = "application/json";
  }

  // Include cookies for same-domain / local dev compat
  options.credentials = "include";

  // Primary auth: Bearer token from localStorage (works cross-domain)
  const accessToken = getStoredToken("accessToken");
  if (accessToken) {
    (options.headers as any)["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, options);

  // Access token expired — attempt silent refresh
  if (response.status === 401 && !path.startsWith("/auth/refresh") && !path.startsWith("/auth/login")) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const storedRefreshToken = getStoredToken("refreshToken");

        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          // Send refreshToken in body — works cross-domain, unlike cookies
          body: storedRefreshToken
            ? JSON.stringify({ refreshToken: storedRefreshToken })
            : undefined,
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.data.accessToken;
          const newRefreshToken = refreshData.data.refreshToken;

          localStorage.setItem("accessToken", newAccessToken);
          if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

          isRefreshing = false;
          onRefreshed(newAccessToken);
        } else {
          isRefreshing = false;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error("Session expired");
        }
      } catch (err) {
        isRefreshing = false;
        throw err;
      }
    }

    return new Promise((resolve) => {
      subscribeTokenRefresh(() => {
        resolve(apiFetch(path, options));
      });
    });
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.error?.message || "Something went wrong";
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.details = data.error?.details;
    error.code = data.error?.code;
    throw error;
  }

  return data;
}

export const api = {
  get: (path: string, options?: RequestOptions) => apiFetch(path, { ...options, method: "GET" }),
  post: (path: string, body?: any, options?: RequestOptions) => apiFetch(path, { ...options, method: "POST", json: body }),
  patch: (path: string, body?: any, options?: RequestOptions) => apiFetch(path, { ...options, method: "PATCH", json: body }),
  delete: (path: string, options?: RequestOptions) => apiFetch(path, { ...options, method: "DELETE" }),
  upload: (path: string, formData: FormData, options?: RequestOptions) => {
    return apiFetch(path, {
      ...options,
      method: "POST",
      body: formData,
    });
  },
};
