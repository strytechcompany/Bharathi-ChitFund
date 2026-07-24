import api from './api';

const getAllTeams = () => api.get('/fpayment-teams').then(r => r.data.data);
const getTeamById = (id) => api.get(`/fpayment-teams/${id}`).then(r => r.data.data);
const createTeam = (data) => api.post('/fpayment-teams', data).then(r => r.data.data);
const updateTeam = (id, data) => api.put(`/fpayment-teams/${id}`, data).then(r => r.data.data);
const deleteTeam = (id) => api.delete(`/fpayment-teams/${id}`).then(r => r.data);
const addMember = (id, data) => api.post(`/fpayment-teams/${id}/members`, data).then(r => r.data.data);
const updateMember = (id, memberId, data) => api.put(`/fpayment-teams/${id}/members/${memberId}`, data).then(r => r.data.data);
const removeMember = (id, memberId) => api.delete(`/fpayment-teams/${id}/members/${memberId}`).then(r => r.data.data);

export default { getAllTeams, getTeamById, createTeam, updateTeam, deleteTeam, addMember, updateMember, removeMember };
