import { create } from 'zustand';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  verify: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const PERSIST_KEY = 'ebook-auth';

function persist(state: { token: string | null; user: User | null }) {
  localStorage.setItem(PERSIST_KEY, JSON.stringify({ state }));
}

function loadPersisted(): { token: string | null; user: User | null } {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw).state ?? { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

const persisted = loadPersisted();

export const useAuth = create<AuthState>((set) => ({
  token: persisted.token,
  user: persisted.user,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.auth.login({ email, password });
      const state = { token: res.token, user: res.user };
      set({ ...state, loading: false });
      persist(state);
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true });
    try {
      const res = await api.auth.register({ email, password, name });
      const state = { token: res.token, user: res.user };
      set({ ...state, loading: false });
      persist(state);
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    const state = { token: null, user: null };
    set(state);
    localStorage.removeItem(PERSIST_KEY);
  },

  updateProfile: async (name) => {
    const user = await api.auth.updateProfile(name);
    const state = { token: useAuth.getState().token, user };
    set(state);
    persist(state);
  },

  changePassword: async (oldPassword, newPassword) => {
    await api.auth.changePassword(oldPassword, newPassword);
  },

  verify: async () => {
    const t = useAuth.getState().token;
    if (!t) return;
    try {
      const user = await api.auth.me();
      const state = { token: t, user };
      set({ ...state });
      persist(state);
    } catch {
      const state = { token: null, user: null };
      set(state);
      localStorage.removeItem(PERSIST_KEY);
    }
  },
}));
