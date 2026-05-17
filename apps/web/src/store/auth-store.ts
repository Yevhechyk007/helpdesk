import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, User } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

interface AuthActions {
  setAuth: (tokens: AuthTokens) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens: AuthTokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user,
        });
      },
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
