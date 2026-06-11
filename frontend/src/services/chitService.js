import api from './api';

const getAll = () => api.get('/chits').then(r => r.data.data);
const getOne = (id) => api.get(`/chits/${id}`).then(r => r.data.data);
const create = (data) => api.post('/chits', data).then(r => r.data.data);
const update = (id, data) => api.put(`/chits/${id}`, data).then(r => r.data.data);
const remove = (id) => api.delete(`/chits/${id}`).then(r => r.data);

export default { getAll, getOne, create, update, remove };
