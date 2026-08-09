import { create } from "zustand";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "ORGANIZER" | "PARTICIPANT";
  avatarUrl?: string | null;
  phoneVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem("evenio_token", token);
    localStorage.setItem("evenio_user", JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("evenio_token");
    localStorage.removeItem("evenio_user");
    set({ user: null, token: null });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("evenio_token");
    const userStr = localStorage.getItem("evenio_user");
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },
}));