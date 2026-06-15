import { useEffect } from "react";
import { useAuthStore } from "../lib/store";
import { useRouter } from "next/navigation";
import { SignupInput, LoginInput } from "@task-manager/shared";
import { api } from "../lib/api";

// Auth calls go through the Next.js BFF (/api/auth/...) on the same Vercel domain.
// The BFF sets/reads HttpOnly cookies server-side — no token ever touches localStorage.
// The accessToken is kept in Zustand memory only (cleared on page refresh, recovered via /api/auth/refresh).

async function bffFetch(path: string, body?: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Request failed");
  }
  return data;
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isInitialized, setUser, setToken, setInitialized } = useAuthStore();

  const signup = async (input: SignupInput) => {
    return api.post("/auth/signup", input);
  };

  const login = async (input: LoginInput) => {
    // BFF sets HttpOnly refreshToken cookie on Vercel domain
    // Returns accessToken in body for in-memory storage only
    const res = await bffFetch("/api/auth/login", input);
    setUser(res.data.user);
    setToken(res.data.accessToken);
    setInitialized(true);
    router.push("/tasks");
  };

  const logout = async () => {
    try {
      // BFF clears the HttpOnly cookie server-side
      await bffFetch("/api/auth/logout");
    } catch (e) {
      // Ignore network errors
    }
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async () => {
      try {
        // BFF reads the HttpOnly refreshToken cookie server-side and issues a new accessToken
        const res = await bffFetch("/api/auth/refresh");
        setUser(res.data.user);
        setToken(res.data.accessToken);
      } catch {
        // No valid session — clear state
        setUser(null);
        setToken(null);
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [isInitialized, setInitialized, setUser, setToken]);

  return {
    user,
    accessToken,
    isInitialized,
    signup,
    login,
    logout,
  };
}
