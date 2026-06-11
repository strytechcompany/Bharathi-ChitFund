const DUMMY = { username: 'admin', password: 'admin123' };

const login = (username, password) => {
  if (username === DUMMY.username && password === DUMMY.password) {
    const user = { username: 'admin', name: 'Admin User', role: 'SUPER ADMIN' };
    localStorage.setItem('bharathi_user', JSON.stringify(user));
    return { success: true, user };
  }
  throw new Error('Invalid username or password');
};

const logout = () => {
  localStorage.removeItem('bharathi_user');
};

const getCurrentUser = () => {
  try {
    const u = localStorage.getItem('bharathi_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const isAuthenticated = () => !!getCurrentUser();

export default { login, logout, getCurrentUser, isAuthenticated };
