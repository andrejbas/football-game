import api from './client'

export const teamsApi = {
  // Returns paginated payload: { data: [...], links, meta }
  list: (params) => api.get('/teams', { params }).then((r) => r.data.data),
  show: (id) => api.get(`/teams/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/teams', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/teams/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/teams/${id}`).then((r) => r.data),

  members: (id) => api.get(`/teams/${id}/members`).then((r) => r.data.data),
  join: (id) => api.post(`/teams/${id}/join`).then((r) => r.data),
  leave: (id) => api.delete(`/teams/${id}/leave`).then((r) => r.data),
}
