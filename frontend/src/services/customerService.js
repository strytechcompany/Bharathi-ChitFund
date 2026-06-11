import api from './api';

const getAll = () => api.get('/customers').then(r => r.data.data);
const getOne = (id) => api.get(`/customers/${id}`).then(r => r.data.data);
const create = (data) => api.post('/customers', data).then(r => r.data.data);
const update = (id, data) => api.put(`/customers/${id}`, data).then(r => r.data.data);
const remove = (id) => api.delete(`/customers/${id}`).then(r => r.data);

export default { getAll, getOne, create, update, remove };
