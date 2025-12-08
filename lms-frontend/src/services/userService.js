import api from './api'; // Assuming api.js exports an axios instance with baseURL set

// --- GET: List Users ---
export const getUsers = async (role = '', domain_id = '', is_active = '', skip = 0, limit = 100) => {
  const params = { skip, limit };
  if (role) params.role = role;
  if (domain_id) params.domain_id = domain_id;
  if (is_active !== '') params.is_active = is_active;

  const response = await api.get('/users/', { params });
  return response.data;
};

// --- PATCH: Update User ---
export const updateUser = async (user_id, userData) => {
  const response = await api.patch(`/users/${user_id}`, userData);
  return response.data;
};

// --- DELETE: User (Two-step process) ---
// Step 1: Check (confirm=false) - Returns warning message
// Step 2: Delete (confirm=true) - Actually deletes
export const deleteUser = async (user_id, confirm = false) => {
  const response = await api.delete(`/users/${user_id}`, {
    params: { confirm }
  });
  return response.data;
};

// --- POST: Create User (Role specific) ---
export const registerTrainer = async (data) => {
  const response = await api.post('/auth/register-trainer', data);
  return response.data;
};

export const registerAdmin = async (data) => {
  const response = await api.post('/auth/register-admin', data);
  return response.data;
};

export const registerStudent = async (data) => {
  const response = await api.post('/auth/register-student', data);
  return response.data;
};