import api from './api';

const getAll = () => api.get('/fpayment-customers').then(r => r.data.data);
const getOne = (id) => api.get(`/fpayment-customers/${id}`).then(r => r.data.data);
const getByMobile = (mobile) => api.get(`/fpayment-customers/mobile/${mobile}`).then(r => r.data.data);
const create = (data) => api.post('/fpayment-customers', data).then(r => r.data.data);
const update = (id, data) => api.put(`/fpayment-customers/${id}`, data).then(r => r.data.data);
const remove = (id) => api.delete(`/fpayment-customers/${id}`).then(r => r.data);
const addTransaction = (id, data) => api.post(`/fpayment-customers/${id}/transactions`, data).then(r => r.data.data);

export default { getAll, getOne, getByMobile, create, update, remove, addTransaction };
