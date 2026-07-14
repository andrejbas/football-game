import api from './client'

export const playerApi = {
  show: () => api.get('/player').then((r) => r.data.data),
  showById: (id) => api.get(`/players/${id}`).then((r) => r.data.data),
  update: (payload) => api.patch('/player', payload).then((r) => r.data.data),
  train: (payload) => api.post('/player/train', payload).then((r) => r.data.data),
  energy: () => api.get('/player/energy').then((r) => r.data.data),
}