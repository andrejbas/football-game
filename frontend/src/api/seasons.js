import api from './client'

export const seasonsApi = {
  current: () => api.get('/seasons/current').then((r) => r.data.data),
  // params: { league_id, team_id, page } -> paginated payload
  history: (params) => api.get('/seasons/history', { params }).then((r) => r.data.data),
}
