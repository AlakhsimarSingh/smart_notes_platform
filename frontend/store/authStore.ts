'use client';

import { create } from 'zustand';

type User = {
  id: string;
  email: string;
};

type AuthState = {
  token: string | null;

  user: User | null;

  hydrated: boolean;

  setAuth: (
    token: string,
    user: User
  ) => void;

  logout: () => void;

  hydrate: () => void;
};

export const useAuthStore =
  create<AuthState>((set) => ({
    token: null,

    user: null,

    hydrated: false,

    setAuth: (token, user) => {
      localStorage.setItem(
        'token',
        token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );

      set({
        token,
        user,
      });
    },

    logout: () => {
      localStorage.removeItem('token');

      localStorage.removeItem('user');

      set({
        token: null,
        user: null,
      });
    },

    hydrate: () => {
      const token =
        localStorage.getItem('token');

      const user =
        localStorage.getItem('user');

      set({
        token,
        user: user
          ? JSON.parse(user)
          : null,
        hydrated: true,
      });
    },
  }));