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
import styles from './UserManagement.module.css';

/**
 * UserManagement - Admin page for managing users (CRUD operations)
 * Layout is provided by AdminLayout via routing - this component renders content only
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', username: '', password: '', domain_id: '' });
  const [deleteData, setDeleteData] = useState({ id: null, message: '', confirmed: false });

  const [domainOptions, setDomainOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState({ show: false, text: '' });

  const normalizeDomainId = (id) => {
    if (id === '' || id == null) return null;
    if (/^\d+$/.test(String(id))) return Number(id);
    return id;
  };

  const showSuccess = (message) => {
    setSuccessMessage({ show: true, text: message });
    setTimeout(() => setSuccessMessage({ show: false, text: '' }), 5000);
  };

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

  const ensureDomainsLoaded = async () => {
    if (domainOptions && domainOptions.length > 0) {
      return domainOptions;
    }

    try {
      const res = await api.get('/domains/');
      let raw = [];
      if (Array.isArray(res.data)) raw = res.data;
      else if (res.data?.results && Array.isArray(res.data.results)) raw = res.data.results;
      else if (res.data?.data && Array.isArray(res.data.data)) raw = res.data.data;

      const normalized = raw.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id }));
      setDomainOptions(normalized);
      return normalized;
    } catch (err) {
      console.warn('Could not fetch domains for UserManagement:', err?.response?.data || err?.message);
      setDomainOptions([]);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      await ensureDomainsLoaded();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentSkip = (page - 1) * limit;

      const data = await getUsers(roleFilter, '', '', currentSkip, limit);
      const list = Array.isArray(data) ? data : (data?.results || []);

      const domains = await ensureDomainsLoaded();

      const mapped = list.map(u => {
        let domainFromUser = u?.domain?.name || u?.domain_name || u?.domain;
        if (!domainFromUser && domains && domains.length) {
          const match = domains.find(d => String(d.id) === String(u.domain_id));
          if (match) domainFromUser = match.name;
        }
        return { ...u, domain_name: domainFromUser ?? (u.domain_id ?? '-') };
      });

      setUsers(mapped);
    } catch (err) {
      console.error('fetchUsers error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, page, limit]);

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
    if (!newUser.domain_id) newErrors.domain_id = 'Domain is required for students';
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

  const handleEditClick = (u) => {
    setSelectedUser({ ...u });
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

  const handleDeleteInit = async (u) => {
    try {
      setLoading(true);
      const resp = await deleteUser(u.id, false);
      let msg = '';

      if (typeof resp === 'string') msg = resp;
      else if (resp?.message) msg = resp.message;
      else if (resp?.detail) msg = typeof resp.detail === 'string' ? resp.detail : JSON.stringify(resp.detail);
      else msg = JSON.stringify(resp);

      setDeleteData({ id: u.id, message: msg, confirmed: false });
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
      await deleteUser(deleteData.id, true);
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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'trainer': return styles.roleTrainer;
      case 'student': return styles.roleStudent;
      default: return styles.badge;
    }
  };

  return (
    <div className={styles.container}>
      {successMessage.show && (
        <div className={styles.successMessage}>
          <div>{successMessage.text}</div>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <label htmlFor="roleFilter">Filter by Role:</label>
          <select id="roleFilter" name="roleFilter" value={roleFilter} onChange={handleRoleChange}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className={styles.paginationControls}>
          <label htmlFor="limitSelect">Rows per page:</label>
          <select id="limitSelect" name="limit" value={limit} onChange={handleLimitChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className={styles.pageInfo}>Page {page}</span>
          <button type="button" disabled={page === 1} onClick={handlePrevPage}>Prev</button>
          <button type="button" disabled={users.length < limit} onClick={handleNextPage}>Next</button>
        </div>

        <button type="button" className={styles.btnPrimary} onClick={handleCreateClick}>+ Create User</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Domain Name</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className={selectedUser?.id === u.id ? styles.activeRow : ''}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(u.role)}>{u.role}</span>
                  </td>
                  <td>{u.domain_name ?? '-'}</td>
                  <td>
                    <span className={u.is_active ? styles.statusActive : styles.statusInactive}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.btnEdit} onClick={() => handleEditClick(u)}>Edit</button>
                    <button type="button" className={styles.btnDelete} onClick={() => handleDeleteInit(u)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {!createRole ? (
              <>
                <h3>Create New User</h3>
                <div className={styles.roleSelection}>
                  <p>Select User Type:</p>
                  <div className={styles.roleButtons}>
                    <button type="button" onClick={() => { setCreateRole('student'); setErrors({}); }}>Student</button>
                    <button type="button" onClick={() => { setCreateRole('trainer'); setErrors({}); }}>Trainer</button>
                    <button type="button" onClick={() => { setCreateRole('admin'); setErrors({}); }}>Admin</button>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button type="button" className={styles.btnCancel} onClick={() => setShowCreateModal(false)}>Cancel</button>
                  </div>
                  {errors.general && <div className={styles.formError}>{errors.general}</div>}
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
                  <div className={styles.formGroup}>
                    <label htmlFor="newUserEmail">Email:</label>
                    <input
                      type="email"
                      id="newUserEmail"
                      name="email"
                      required
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                    {errors.email && <div className={styles.formError}>{errors.email}</div>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="newUserUsername">Username:</label>
                    <input
                      type="text"
                      id="newUserUsername"
                      name="username"
                      required
                      value={newUser.username}
                      onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Enter a username (min. 3 characters)"
                    />
                    {errors.username && <div className={styles.formError}>{errors.username}</div>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="newUserPassword">Password:</label>
                    <input
                      type="password"
                      id="newUserPassword"
                      name="password"
                      required
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter a secure password (min. 8 characters)"
                    />
                    {errors.password && <div className={styles.formError}>{errors.password}</div>}
                  </div>

                  {(createRole === 'trainer' || createRole === 'student') && (
                    <div className={styles.formGroup}>
                      <label htmlFor="newUserDomain">Domain *</label>
                      <select
                        id="newUserDomain"
                        name="domain_id"
                        required
                        value={newUser.domain_id}
                        onChange={e => setNewUser({ ...newUser, domain_id: e.target.value })}
                      >
                        <option value="">Select a domain (required)</option>
                        {domainOptions.map(domain => (
                          <option key={domain.id} value={domain.id}>{domain.name}</option>
                        ))}
                      </select>
                      {errors.domain_id && <div className={styles.formError}>{errors.domain_id}</div>}
                    </div>
                  )}

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.btnCancel}
                      onClick={() => { setCreateRole(''); setErrors({}); }}
                    >
                      Back
                    </button>

                    <button type="submit" className={styles.btnPrimary} disabled={loading}>
                      {loading ? 'Registering...' : `Create ${createRole}`}
                    </button>

                    <button type="button" className={styles.btnCancel} onClick={() => setShowCreateModal(false)}>
                      Close
                    </button>

                    {errors.general && <div className={styles.formError}>{errors.general}</div>}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Edit User</h3>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="editUserEmail">Email:</label>
                <input
                  type="email"
                  id="editUserEmail"
                  name="email"
                  value={selectedUser.email || ''}
                  onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
                {errors.email && <div className={styles.formError}>{errors.email}</div>}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editUserUsername">Username:</label>
                <input
                  type="text"
                  id="editUserUsername"
                  name="username"
                  value={selectedUser.username || ''}
                  onChange={e => setSelectedUser({ ...selectedUser, username: e.target.value })}
                />
                {errors.username && <div className={styles.formError}>{errors.username}</div>}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editUserRole">Role:</label>
                <select
                  id="editUserRole"
                  name="role"
                  value={selectedUser.role || 'student'}
                  onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editUserDomain">Domain ID:</label>
                <select
                  id="editUserDomain"
                  name="domain_id"
                  value={selectedUser.domain_id || ''}
                  onChange={e => setSelectedUser({ ...selectedUser, domain_id: e.target.value })}
                >
                  <option value="">None</option>
                  {domainOptions.map(domain => (
                    <option key={domain.id} value={domain.id}>{domain.name}</option>
                  ))}
                </select>
                {errors.domain_id && <div className={styles.formError}>{errors.domain_id}</div>}
              </div>
              <div className={styles.formGroupCheckbox}>
                <input
                  type="checkbox"
                  id="editUserIsActive"
                  name="is_active"
                  checked={!!selectedUser.is_active}
                  onChange={e => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                />
                <label htmlFor="editUserIsActive">Is Active</label>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary}>Save Changes</button>
                <button type="button" className={styles.btnCancel} onClick={() => setShowEditModal(false)}>Cancel</button>
                {errors.general && <div className={styles.formError}>{errors.general}</div>}
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Deletion</h3>
            <p className={styles.warningText}>{deleteData.message || "Are you sure you want to delete this user?"}</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnDelete} onClick={handleDeleteConfirm}>Yes, Permanently Delete</button>
              <button type="button" className={styles.btnCancel} onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
