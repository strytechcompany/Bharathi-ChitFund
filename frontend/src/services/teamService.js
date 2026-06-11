import api from './api';

const getAll = (chitScheme) => api.get('/teams', { params: chitScheme ? { chitScheme } : {} }).then(r => r.data.data);
const getOne = (id) => api.get(`/teams/${id}`).then(r => r.data.data);
const create = (data) => api.post('/teams', data).then(r => r.data.data);
const update = (id, data) => api.put(`/teams/${id}`, data).then(r => r.data.data);
const remove = (id) => api.delete(`/teams/${id}`).then(r => r.data);

export default { getAll, getOne, create, update, remove };
