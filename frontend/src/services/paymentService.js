import api from './api';

const getAll = (params) => api.get('/payments', { params }).then(r => r.data.data);
const create = (data) => api.post('/payments', data).then(r => r.data.data);
const update = (id, data) => api.put(`/payments/${id}`, data).then(r => r.data.data);
const getUnpaidNotifications = () => api.get('/payments/unpaid-notifications').then(r => r.data.data);

export default { getAll, create, update, getUnpaidNotifications };
