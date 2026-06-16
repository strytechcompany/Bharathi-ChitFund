const getDummyAuth = () => {
  const customPass = localStorage.getItem('bharathi_dummy_pass');
  return { username: 'admin', password: customPass || 'admin123' };
};

const login = (username, password) => {
  const dummy = getDummyAuth();
  if (username === dummy.username && password === dummy.password) {
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

const changePassword = (currentPassword, newPassword) => {
  const dummy = getDummyAuth();
  if (currentPassword !== dummy.password) {
    throw new Error('Incorrect current password');
  }
  localStorage.setItem('bharathi_dummy_pass', newPassword);
  return { success: true };
};

export default { login, logout, getCurrentUser, isAuthenticated, changePassword };
