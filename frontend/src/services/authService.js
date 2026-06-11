import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data;
};

const verifyOTP = async (email, otp) => {
  const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const getMe = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const response = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
};

export default {
  login,
  verifyOTP,
  getMe,
  logout
};
