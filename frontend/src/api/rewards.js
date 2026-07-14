import api from './client'

export const rewardsApi = {
  // Returns paginated payload: { data: [...], links, meta }
  list: (params) => api.get('/rewards', { params }).then((r) => r.data.data),
}
