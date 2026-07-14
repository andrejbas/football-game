import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, type, title, message }] }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
    return id
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Convenience helpers
export const toast = {
  success: (title, message, duration) =>
    useToastStore.getState().addToast({ type: 'success', title, message, duration }),
  error: (title, message, duration) =>
    useToastStore.getState().addToast({ type: 'error', title, message, duration }),
  info: (title, message, duration) =>
    useToastStore.getState().addToast({ type: 'info', title, message, duration }),
  warning: (title, message, duration) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, duration }),
}
