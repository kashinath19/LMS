import api from './api';

let _cachedDomains = null;

const loadDomainsOnce = async () => {
  if (_cachedDomains) return _cachedDomains;
  try {
    const res = await api.get('/domains/');
    let raw = [];
    if (Array.isArray(res.data)) raw = res.data;
    else if (res.data?.results && Array.isArray(res.data.results)) raw = res.data.results;
    else if (res.data?.data && Array.isArray(res.data.data)) raw = res.data.data;

    const normalized = raw.map(d => ({ id: d.id, name: d.name || d.title || d.label || String(d.id) }));
    _cachedDomains = normalized;
    return normalized;
  } catch (err) {
    _cachedDomains = [];
    return [];
  }
};

// --- GET: List Users ---
// Returns an array of user objects (normalized from multiple possible response shapes)
export const getUsers = async (role = '', domain_id = '', is_active = '', skip = 0, limit = 100) => {
  const params = {};
  if (role) params.role = role;
  if (domain_id) params.domain_id = domain_id;
  if (is_active !== '') params.is_active = is_active;
  if (typeof skip !== 'undefined') params.skip = skip;
  if (typeof limit !== 'undefined') params.limit = limit;

  try {
    const response = await api.get('/users/', { params });
    const d = response.data;
    let users = [];

    if (Array.isArray(d)) users = d;
    else if (d?.results && Array.isArray(d.results)) users = d.results;
    else if (d?.data && Array.isArray(d.data)) users = d.data;
    else if (d?.users && Array.isArray(d.users)) users = d.users;
    else if (d?.items && Array.isArray(d.items)) users = d.items;
    else if (d && typeof d === 'object') {
      const arr = Object.values(d).find(v => Array.isArray(v));
      if (Array.isArray(arr)) users = arr;
    }

    // attach domain_name using domains (cached)
    const domains = await loadDomainsOnce();
    const mapped = users.map(u => {
      let domainFromUser = u?.domain?.name || u?.domain_name || u?.domain;
      if (!domainFromUser && domains && domains.length) {
        const match = domains.find(dd => String(dd.id) === String(u.domain_id));
        if (match) domainFromUser = match.name;
      }
      return { ...u, domain_name: domainFromUser ?? (u.domain_id ?? null) };
    });

    return mapped;
  } catch (err) {
    throw err;
  }
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