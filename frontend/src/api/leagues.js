import api from './client'

export const leaguesApi = {
  // Returns paginated payload: { data: [...], links, meta }
  list: (params) => api.get('/leagues', { params }).then((r) => r.data.data),
  show: (id) => api.get(`/leagues/${id}`).then((r) => r.data.data),
  adminCreate: (payload) => api.post('/admin/leagues', payload).then((r) => r.data.data),
  // { league, standings: [...] }
  standings: (id) => api.get(`/leagues/${id}/standings`).then((r) => r.data.data),
  // { league, schedule: [{ game_day, matches: [...] }] }
  schedule: (id) => api.get(`/leagues/${id}/schedule`).then((r) => r.data.data),

  // Admin lifecycle controls
  adminStart: (id) => api.post(`/admin/leagues/${id}/start`).then((r) => r.data.data),
  adminAdvanceGameDay: (id) => api.post(`/admin/leagues/${id}/advance-game-day`).then((r) => r.data.data),
  adminEndSeason: (id) => api.post(`/admin/leagues/${id}/end-season`).then((r) => r.data.data),
  adminReset: (id) => api.post(`/admin/leagues/${id}/reset`).then((r) => r.data.data),
}
