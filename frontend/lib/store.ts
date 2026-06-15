import { create } from "zustand";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setToken: (accessToken) => set({ accessToken }),
  setInitialized: (isInitialized) => set({ isInitialized }),
}));
