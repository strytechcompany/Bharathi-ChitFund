import api from './api';

const getAll = () => api.get('/payment-schemes').then(r => r.data.data);
const getOne = (id) => api.get(`/payment-schemes/${id}`).then(r => r.data.data);
const create = (data) => api.post('/payment-schemes', data).then(r => r.data.data);
const update = (id, data) => api.put(`/payment-schemes/${id}`, data).then(r => r.data.data);
const remove = (id) => api.delete(`/payment-schemes/${id}`).then(r => r.data);

export default { getAll, getOne, create, update, remove };
