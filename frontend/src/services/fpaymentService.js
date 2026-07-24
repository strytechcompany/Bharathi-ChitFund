import api from './api';

const getAllFPayments = (params) => api.get('/fpayment', { params }).then(r => r.data.data);
const getFPaymentById = (id) => api.get(`/fpayment/${id}`).then(r => r.data.data);
const createFPayment = (data) => api.post('/fpayment', data).then(r => r.data.data);
const updateFPayment = (id, data) => api.put(`/fpayment/${id}`, data).then(r => r.data.data);
const deleteFPayment = (id) => api.delete(`/fpayment/${id}`).then(r => r.data);

export default { getAllFPayments, getFPaymentById, createFPayment, updateFPayment, deleteFPayment };
