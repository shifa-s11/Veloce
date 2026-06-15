import { useEffect } from "react";
import { useAuthStore } from "../lib/store";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";
import { SignupInput, LoginInput } from "@task-manager/shared";

// Sets/clears a lightweight cookie on the frontend domain so Next.js middleware
// can detect session state (the real refreshToken cookie lives on the backend domain).
function setSessionCookie(loggedIn: boolean) {
  if (typeof document === "undefined") return;
  if (loggedIn) {
    document.cookie = "isLoggedIn=1; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "isLoggedIn=; path=/; max-age=0; SameSite=Lax";
  }
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isInitialized, setUser, setToken, setInitialized } = useAuthStore();

  const signup = async (input: SignupInput) => {
    return api.post("/auth/signup", input);
  };

  const login = async (input: LoginInput) => {
    const res = await api.post("/auth/login", input);
    setUser(res.data.user);
    setToken(res.data.accessToken);
    setInitialized(true); // prevent the refresh effect from re-running on the dashboard
    setSessionCookie(true);
    router.push("/tasks");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore
    }
    setUser(null);
    setToken(null);
    setSessionCookie(false);
    router.push("/login");
  };

  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setUser(res.data.user);
        setToken(res.data.accessToken);
        setSessionCookie(true);
      } catch (err) {
        setUser(null);
        setToken(null);
        setSessionCookie(false);
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
