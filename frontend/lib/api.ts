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

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<any> {
  const url = `${API_URL}${path}`;

  if (!options.headers) {
    options.headers = {};
  }

  if (options.json) {
    options.body = JSON.stringify(options.json);
    (options.headers as any)["Content-Type"] = "application/json";
  }

  options.credentials = "include";

  const response = await fetch(url, options);

  if (response.status === 401 && !path.startsWith("/auth/refresh") && !path.startsWith("/auth/login")) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.data.accessToken;
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } else {
          isRefreshing = false;
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
