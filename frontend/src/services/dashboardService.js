import api from './api';

const getSummary = () => api.get('/dashboard/summary').then(r => r.data.data);

export default { getSummary };
