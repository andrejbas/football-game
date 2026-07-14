import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: ({ user, token }) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),

      isAuthenticated: () => Boolean(useAuthStore.getState().token),
      isAdmin: () => useAuthStore.getState().user?.role === 'admin',
    }),
    {
      name: 'football-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
