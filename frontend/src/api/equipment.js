import api from './client'

export const equipmentApi = {
  list: () => api.get('/equipment').then((r) => r.data.data),
  show: (id) => api.get(`/equipment/${id}`).then((r) => r.data.data),
  equip: (id) => api.post(`/equipment/${id}/equip`).then((r) => r.data.data),
  unequip: (id) => api.post(`/equipment/${id}/unequip`).then((r) => r.data.data),
  // { equipment_ids: [id, id, id] }
  merge: (equipmentIds) =>
    api.post('/equipment/merge', { equipment_ids: equipmentIds }).then((r) => r.data.data),
}
