import { useEffect } from "react";
import { useAuthStore } from "../lib/store";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";
import { SignupInput, LoginInput } from "@task-manager/shared";

// Sets/clears a lightweight cookie on the frontend domain so Next.js middleware
// can detect session state (the real tokens live in localStorage).
function setSessionCookie(loggedIn: boolean) {
  if (typeof document === "undefined") return;
  if (loggedIn) {
    document.cookie = "isLoggedIn=1; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "isLoggedIn=; path=/; max-age=0; SameSite=Lax";
  }
}

function persistTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  setSessionCookie(true);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  setSessionCookie(false);
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isInitialized, setUser, setToken, setInitialized } = useAuthStore();

  const signup = async (input: SignupInput) => {
    return api.post("/auth/signup", input);
  };

  const login = async (input: LoginInput) => {
    const res = await api.post("/auth/login", input);
    const { user, accessToken, refreshToken } = res.data;
    persistTokens(accessToken, refreshToken);
    setUser(user);
    setToken(accessToken);
    setInitialized(true); // prevent re-running refresh effect on dashboard mount
    router.push("/tasks");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore network errors on logout
    }
    clearTokens();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async () => {
      const storedRefreshToken = typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

      if (!storedRefreshToken) {
        // No session at all — go to login
        clearTokens();
        setUser(null);
        setToken(null);
        setInitialized(true);
        return;
      }

      try {
        // Send refreshToken in body — cross-domain safe
        const res = await api.post("/auth/refresh", { refreshToken: storedRefreshToken });
        const { user, accessToken, refreshToken } = res.data;
        persistTokens(accessToken, refreshToken);
        setUser(user);
        setToken(accessToken);
      } catch (err) {
        // Refresh token expired or revoked — clear session
        clearTokens();
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
