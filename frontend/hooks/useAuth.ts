import { useEffect } from "react";
import { useAuthStore } from "../lib/store.js";
import { api } from "../lib/api.js";
import { useRouter } from "next/navigation";
import { SignupInput, LoginInput } from "@task-manager/shared";

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
    router.push("/login");
  };

  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setUser(res.data.user);
        setToken(res.data.accessToken);
      } catch (err) {
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
