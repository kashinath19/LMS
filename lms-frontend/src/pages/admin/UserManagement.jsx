import React, { useState, useEffect } from 'react';
import { 
  getUsers, 
  updateUser, 
  deleteUser, 
  registerAdmin, 
  registerTrainer, 
  registerStudent 
} from '../../services/userService';
import api from '../../services/api';
import './UserManagement.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

const UserManagement = () => {
  // --- State: Data & UI ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- State: Filters & Pagination ---
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [skip, setSkip] = useState(0);

  // --- State: Modals ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- State: Active Record Data ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', username: '', password: '', domain_id: '' });
  const [deleteData, setDeleteData] = useState({ id: null, message: '', confirmed: false });

  // --- Admin-like state: domains, errors, success message ---
  const [domainOptions, setDomainOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState({ show: false, text: '' });

  // --- Helper: normalize domain_id like AdminDashboard ---
  const normalizeDomainId = (id) => {
    if (id === '' || id == null) return null;
    if (/^\d+$/.test(String(id))) return Number(id);
    return id;
  };

  const showSuccess = (message) => {
    setSuccessMessage({ show: true, text: message });
    setTimeout(() => setSuccessMessage({ show: false, text: '' }), 5000);
  };

  // --- Parse backend validation errors (copied logic) ---
  const parseValidationErrors = (respData) => {
    const newErrors = {};
    if (!respData) return newErrors;

    if (Array.isArray(respData.detail)) {
      respData.detail.forEach(err => {
        const loc = err.loc || [];
        const msg = err.msg || (err.message ?? 'Invalid value');
        if (loc.includes('email')) newErrors.email = msg;
        else if (loc.includes('username')) newErrors.username = msg;
        else if (loc.includes('password')) newErrors.password = msg;
        else if (loc.includes('domain') || loc.includes('domain_id')) newErrors.domain_id = msg;
        else if (typeof err === 'string') newErrors.general = err;
        else newErrors.general = newErrors.general ? `${newErrors.general}; ${msg}` : msg;
      });
      return newErrors;
    }

    if (typeof respData.detail === 'string') {
      if (respData.detail.toLowerCase().includes('domain')) newErrors.domain_id = respData.detail;
      else newErrors.general = respData.detail;
      return newErrors;
    }

    if (typeof respData === 'object') {
      Object.keys(respData).forEach(key => {
        const val = respData[key];
        if (Array.isArray(val)) newErrors[key] = val.join(', ');
        else newErrors[key] = String(val);
      });
      return newErrors;
    }

    return newErrors;
  };

  // --- Fetch Domains & Users on mount ---
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await api.get('/domains', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (Array.isArray(res.data)) {
          setDomainOptions(res.data.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id })));
        } else if (res.data?.results && Array.isArray(res.data.results)) {
          setDomainOptions(res.data.results.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id })));
        } else {
          // fallback
          setDomainOptions([]);
        }
      } catch (err) {
        console.warn('Could not fetch domains for UserManagement:', err?.response?.data || err.message);
        setDomainOptions([]);
      }
    };

    fetchDomains();
    // eslint-disable-next-line
  }, []);

  // --- Fetch Users ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentSkip = (page - 1) * limit;
      setSkip(currentSkip);

      const data = await getUsers(roleFilter, '', '', currentSkip, limit);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setUsers(list);
      setError(null);
    } catch (err) {
      console.error('fetchUsers error:', err);
      setError('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [roleFilter, page, limit]);

  // --- Handlers: Filters & Pagination ---
  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (users.length === limit) setPage(page + 1);
  };

  // --- Create validation functions (same rules as AdminDashboard) ---
  const validateTrainerForm = () => {
    const newErrors = {};
    if (!newUser.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) newErrors.email = 'Email is invalid';
    if (!newUser.username) newErrors.username = 'Username is required';
    else if (newUser.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!newUser.password) newErrors.password = 'Password is required';
    else if (newUser.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!newUser.domain_id) newErrors.domain_id = 'Domain is required for trainers';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStudentForm = () => {
    const newErrors = {};
    if (!newUser.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) newErrors.email = 'Email is invalid';
    if (!newUser.username) newErrors.username = 'Username is required';
    else if (newUser.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!newUser.password) newErrors.password = 'Password is required';
    else if (newUser.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminForm = () => {
    const newErrors = {};
    if (!newUser.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) newErrors.email = 'Email is invalid';
    if (!newUser.username) newErrors.username = 'Username is required';
    else if (newUser.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!newUser.password) newErrors.password = 'Password is required';
    else if (newUser.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers: Create User ---
  const handleCreateClick = () => {
    setNewUser({ email: '', username: '', password: '', domain_id: '' });
    setCreateRole('');
    setErrors({});
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrors({});

      // Validate based on role (same logic as AdminDashboard)
      if (createRole === 'trainer' && !validateTrainerForm()) return;
      if (createRole === 'student' && !validateStudentForm()) return;
      if (createRole === 'admin' && !validateAdminForm()) return;
      if (!createRole) {
        setErrors({ general: 'Please select a role to create.' });
        return;
      }

      const payload = {
        email: newUser.email,
        username: newUser.username,
        password: newUser.password,
        domain_id: normalizeDomainId(newUser.domain_id)
      };

      if (createRole === 'admin') {
        await registerAdmin(payload);
        showSuccess(`Admin '${newUser.username}' registered.`);
      } else if (createRole === 'trainer') {
        await registerTrainer(payload);
        showSuccess(`Trainer '${newUser.username}' registered.`);
      } else if (createRole === 'student') {
        await registerStudent(payload);
        showSuccess(`Student '${newUser.username}' registered.`);
      }

      setShowCreateModal(false);
      setCreateRole('');
      setNewUser({ email: '', username: '', password: '', domain_id: '' });
      await fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      const resp = err?.response?.data;
      const parsed = parseValidationErrors(resp);
      if (Object.keys(parsed).length > 0) {
        setErrors(parsed);
      } else if (err?.response?.status === 409) {
        setErrors({ email: 'This email is already registered.' });
      } else {
        setErrors({ general: err.message || 'Failed to create user' });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Edit User ---
  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setErrors({});
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrors({});
      const payload = {
        email: selectedUser.email,
        username: selectedUser.username,
        role: selectedUser.role,
        is_active: !!selectedUser.is_active,
        domain_id: normalizeDomainId(selectedUser.domain_id)
      };

      await updateUser(selectedUser.id, payload);
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
      showSuccess('User updated successfully.');
    } catch (err) {
      console.error('Update user error:', err);
      const resp = err?.response?.data;
      const parsed = parseValidationErrors(resp);
      if (Object.keys(parsed).length > 0) setErrors(parsed);
      else setErrors({ general: 'Error updating user' });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Delete User (Two-step confirm) ---
  const handleDeleteInit = async (user) => {
    try {
      setLoading(true);
      const resp = await deleteUser(user.id, false); // confirm=false -> should return confirmation message
      let msg = '';

      if (typeof resp === 'string') msg = resp;
      else if (resp?.message) msg = resp.message;
      else if (resp?.detail) msg = typeof resp.detail === 'string' ? resp.detail : JSON.stringify(resp.detail);
      else msg = JSON.stringify(resp);

      setDeleteData({ id: user.id, message: msg, confirmed: false });
      setShowDeleteModal(true);
    } catch (err) {
      console.error('Delete init error:', err);
      setErrors({ general: 'Could not initiate delete process.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await deleteUser(deleteData.id, true); // confirm=true -> perform deletion
      setShowDeleteModal(false);
      setDeleteData({ id: null, message: '', confirmed: true });
      await fetchUsers();
      showSuccess('User deleted.');
    } catch (err) {
      console.error('Delete confirm error:', err);
      const resp = err?.response?.data;
      const parsed = parseValidationErrors(resp);
      if (Object.keys(parsed).length > 0) setErrors(parsed);
      else setErrors({ general: 'Error deleting user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management-container">
      <header className="um-header">
        <h2>User Management</h2>
        <button className="btn-primary" onClick={handleCreateClick}>+ Create User</button>
      </header>

      {/* inline success */}
      {successMessage.show && (
        <div className="success-message show">
          <div>{successMessage.text}</div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="um-controls">
        <div className="filter-group">
          <label>Filter by Role:</label>
          <select value={roleFilter} onChange={handleRoleChange}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="pagination-controls">
          <label>Rows per page:</label>
          <select value={limit} onChange={handleLimitChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="page-info">Page {page}</span>
          <button disabled={page === 1} onClick={handlePrevPage}>Prev</button>
          <button disabled={users.length < limit} onClick={handleNextPage}>Next</button>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Domain ID</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={selectedUser?.id === user.id ? 'active-row' : ''}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td>{user.domain_id || '-'}</td>
                  <td>
                    <span className={user.is_active ? 'status-active' : 'status-inactive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-edit" onClick={() => handleEditClick(user)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteInit(user)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CREATE MODAL --- */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {!createRole ? (
              <>
                <h3>Create New User</h3>
                <div className="role-selection">
                  <p>Select User Type:</p>
                  <div className="role-buttons">
                    <button type="button" onClick={() => { setCreateRole('student'); setErrors({}); }}>Student</button>
                    <button type="button" onClick={() => { setCreateRole('trainer'); setErrors({}); }}>Trainer</button>
                    <button type="button" onClick={() => { setCreateRole('admin'); setErrors({}); }}>Admin</button>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  </div>
                  {errors.general && <div className="form-error show">{errors.general}</div>}
                </div>
              </>
            ) : (
              <>
                <h3>
                  {createRole === 'admin' && 'Register New Admin'}
                  {createRole === 'trainer' && 'Register New Trainer'}
                  {createRole === 'student' && 'Register New Student'}
                </h3>

                <form onSubmit={handleCreateSubmit}>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                    {errors.email && <div className="form-error show">{errors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Enter a username (min. 3 characters)"
                    />
                    {errors.username && <div className="form-error show">{errors.username}</div>}
                  </div>

                  <div className="form-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter a secure password (min. 8 characters)"
                    />
                    {errors.password && <div className="form-error show">{errors.password}</div>}
                  </div>

                  {/* Domain: only show for trainer (required) or student (optional).
                      Do NOT show domain field for admin (as requested). */}
                  {(createRole === 'trainer' || createRole === 'student') && (
                    <div className="form-group">
                      <label>
                        Domain {createRole === 'trainer' ? '*' : '(Optional)'}
                      </label>
                      <select
                        required={createRole === 'trainer'}
                        value={newUser.domain_id}
                        onChange={e => setNewUser({ ...newUser, domain_id: e.target.value })}
                      >
                        <option value=''>
                          {createRole === 'trainer' ? 'Select a domain (required)' : 'Select a domain (optional)'}
                        </option>
                        {domainOptions.map(domain => (
                          <option key={domain.id} value={domain.id}>{domain.name}</option>
                        ))}
                      </select>
                      {errors.domain_id && <div className="form-error show">{errors.domain_id}</div>}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => { setCreateRole(''); setErrors({}); }}
                    >
                      Back
                    </button>

                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? `Registering...` : `Create ${createRole}`}
                    </button>

                    <button type="button" onClick={() => setShowCreateModal(false)}>
                      Close
                    </button>

                    {errors.general && <div className="form-error show">{errors.general}</div>}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit User</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Email:</label>
                <input type="email" value={selectedUser.email || ''}
                  onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} />
                {errors.email && <div className="form-error show">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label>Username:</label>
                <input type="text" value={selectedUser.username || ''}
                  onChange={e => setSelectedUser({...selectedUser, username: e.target.value})} />
                {errors.username && <div className="form-error show">{errors.username}</div>}
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select value={selectedUser.role || 'student'}
                  onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}>
                  <option value="student">Student</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Domain ID:</label>
                <select value={selectedUser.domain_id || ''} onChange={e => setSelectedUser({...selectedUser, domain_id: e.target.value})}>
                  <option value=''>None</option>
                  {domainOptions.map(domain => (
                    <option key={domain.id} value={domain.id}>{domain.name}</option>
                  ))}
                </select>
                {errors.domain_id && <div className="form-error show">{errors.domain_id}</div>}
              </div>
              <div className="form-group-checkbox">
                <label>
                  <input type="checkbox" checked={!!selectedUser.is_active}
                    onChange={e => setSelectedUser({...selectedUser, is_active: e.target.checked})} />
                  Is Active
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                {errors.general && <div className="form-error show">{errors.general}</div>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p className="warning-text">{deleteData.message || "Are you sure you want to delete this user?"}</p>
            <div className="modal-actions">
              <button className="btn-delete" onClick={handleDeleteConfirm}>Yes, Permanently Delete</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;