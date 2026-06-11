import api from './api';

const getAll = (teamId) => api.get('/members', { params: teamId ? { team: teamId } : {} }).then(r => r.data.data);
const getByMobile = (mobile) => api.get('/members', { params: { mobile } }).then(r => r.data.data);
const getOne = (id) => api.get(`/members/${id}`).then(r => r.data.data);
const create = (data) => api.post('/members', data).then(r => r.data.data);
const update = (id, data) => api.put(`/members/${id}`, data).then(r => r.data.data);
const remove = (id) => api.delete(`/members/${id}`).then(r => r.data);

export default { getAll, getByMobile, getOne, create, update, remove };
