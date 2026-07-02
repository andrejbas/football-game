import api from './client'

export const matchesApi = {
  // params: { league_id, game_day, status, page } -> paginated payload
  list: (params) => api.get('/matches', { params }).then((r) => r.data.data),
  show: (id) => api.get(`/matches/${id}`).then((r) => r.data.data),
  gamePlays: (id) => api.get(`/matches/${id}/game-plays`).then((r) => r.data.data),
}

export const gamePlaysApi = {
  show: (id) => api.get(`/game-plays/${id}`).then((r) => r.data.data),
  // { energy_invested: number }
  contribute: (id, energyInvested) =>
    api
      .post(`/game-plays/${id}/contribute`, { energy_invested: energyInvested })
      .then((r) => r.data.data),
}
