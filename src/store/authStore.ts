import { create } from "zustand";
import { auth, User, setToken, removeToken, getToken } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (name: string, emailOrPhone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  loading: false,
  initialized: false,

  hydrate: async () => {
    const token = getToken();
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const { user } = await auth.me();
      set({ user, token, initialized: true });
    } catch {
      removeToken();
      set({ user: null, token: null, initialized: true });
    }
  },

  login: async (emailOrPhone, password) => {
    set({ loading: true });
    try {
      const isEmail = emailOrPhone.includes("@");
      const res = await auth.login(
        isEmail
          ? { email: emailOrPhone, password }
          : { phone: emailOrPhone, password }
      );
      setToken(res.token);
      set({ user: res.user, token: res.token });
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, emailOrPhone, password) => {
    set({ loading: true });
    try {
      const isEmail = emailOrPhone.includes("@");
      const res = await auth.register(
        isEmail
          ? { name, email: emailOrPhone, password }
          : { name, phone: emailOrPhone, password }
      );
      setToken(res.token);
      set({ user: res.user, token: res.token });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await auth.logout();
    } finally {
      removeToken();
      set({ user: null, token: null });
    }
  },

  setUser: (user) => set({ user }),
}));
