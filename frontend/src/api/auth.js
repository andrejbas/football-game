import api from './client'

export const authApi = {
  // { name, email, password, password_confirmation }
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  // { email, password }
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
}
