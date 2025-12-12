import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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

const UserManagement = () => {
  const { setPageTitle, setHeaderComponent } = useOutletContext();

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

  const normalizeDomainId = (id) => (id === '' || id == null ? null : (/^\d+$/.test(String(id)) ? Number(id) : id));
  
  const showSuccess = (message) => {
    setSuccessMessage({ show: true, text: message });
    setTimeout(() => setSuccessMessage({ show: false, text: '' }), 5000);
  };

  const ensureDomainsLoaded = async () => {
    try {
      const res = await api.get('/domains/');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      const normalized = raw.map(d => ({ id: d.id, name: d.name || d.title }));
      setDomainOptions(normalized);
      return normalized;
    } catch (e) { setDomainOptions([]); return []; }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentSkip = (page - 1) * limit;
      const data = await getUsers(roleFilter, '', '', currentSkip, limit);
      const list = Array.isArray(data) ? data : (data?.results || []);
      const domains = await ensureDomainsLoaded();
      
      const mapped = list.map(u => {
        let domainName = u?.domain?.name || u?.domain_name;
        if (!domainName && domains.length) {
            const match = domains.find(d => String(d.id) === String(u.domain_id));
            if(match) domainName = match.name;
        }
        return { ...u, domain_name: domainName ?? '-' };
      });
      setUsers(mapped);
    } catch (err) { 
      console.error('Error fetching users:', err);
      setUsers([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, page, limit]);

  const handleRoleChange = (e) => { setRoleFilter(e.target.value); setPage(1); };
  const handleLimitChange = (e) => { setLimit(parseInt(e.target.value)); setPage(1); };
  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (users.length === limit) setPage(page + 1); };
  
  const handleCreateClick = () => { 
      setNewUser({ email: '', username: '', password: '', domain_id: '' });
      setCreateRole('');
      setErrors({});
      setShowCreateModal(true); 
  };

  // Mock form submissions for brevity - ensure you have your full register functions here
  const handleCreateSubmit = async (e) => { 
      e.preventDefault(); 
      try {
          setLoading(true);
          const payload = { ...newUser, domain_id: normalizeDomainId(newUser.domain_id) };
          if (createRole === 'admin') await registerAdmin(payload);
          else if (createRole === 'trainer') await registerTrainer(payload);
          else if (createRole === 'student') await registerStudent(payload);
          
          showSuccess(`${createRole.charAt(0).toUpperCase() + createRole.slice(1)} created successfully`);
          setShowCreateModal(false);
          fetchUsers();
      } catch (e) { 
        setErrors({ general: 'Failed to create user' }); 
        console.error('Create user error:', e);
      } finally { 
        setLoading(false); 
      }
  };

  const handleEditClick = (u) => { 
    setSelectedUser(u); 
    setShowEditModal(true); 
  };
  
  const handleEditSubmit = async (e) => { 
      e.preventDefault(); 
      try {
          setLoading(true);
          await updateUser(selectedUser.id, { ...selectedUser, domain_id: normalizeDomainId(selectedUser.domain_id) });
          setShowEditModal(false);
          fetchUsers();
          showSuccess('User updated successfully');
      } catch(e) { 
        setErrors({ general: 'Failed to update' }); 
        console.error('Update user error:', e);
      } finally { 
        setLoading(false); 
      }
  };

  const handleDeleteInit = (u) => { 
    setDeleteData({ id: u.id, username: u.username }); 
    setShowDeleteModal(true); 
  };
  
  const handleDeleteConfirm = async () => { 
      try {
          setLoading(true);
          await deleteUser(deleteData.id, true);
          setShowDeleteModal(false);
          fetchUsers();
          showSuccess(`User "${deleteData.username}" deleted`);
      } catch (e) { 
        setErrors({ general: 'Failed to delete' }); 
        console.error('Delete user error:', e);
      } finally { 
        setLoading(false); 
      }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'trainer': return styles.roleTrainer;
      case 'student': return styles.roleStudent;
      default: return '';
    }
  };

  // 1. Clear Page Title so Header is dedicated to Controls
  useEffect(() => {
    setPageTitle(''); 
    return () => setPageTitle('');
  }, [setPageTitle]);

  // 2. Inject Controls into Header
  useEffect(() => {
    if (setHeaderComponent) {
      setHeaderComponent(
        <div className={styles.headerControls}>
          <div className={styles.leftControls}>
            <span className={styles.label}>Filter by Role:</span>
            <select value={roleFilter} onChange={handleRoleChange} className={styles.headerSelect}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="trainer">Trainer</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className={styles.rightControls}>
            <span className={styles.label}>Rows per page:</span>
            <select value={limit} onChange={handleLimitChange} className={styles.headerSelectSmall}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            
            <div className={styles.pageGroup}>
              <span className={styles.label}>Page {page}</span>
              <button 
                onClick={handlePrevPage} 
                disabled={page === 1}
                className={styles.btnPage}
              >
                Prev
              </button>
              <button 
                onClick={handleNextPage} 
                disabled={users.length < limit}
                className={styles.btnPage}
              >
                Next
              </button>
            </div>

            <button className={styles.btnHeaderCreate} onClick={handleCreateClick}>
              + Create User
            </button>
          </div>
        </div>
      );
    }
    return () => setHeaderComponent && setHeaderComponent(null);
  }, [roleFilter, page, limit, users.length, setHeaderComponent]);

  return (
    <div className={styles.container}>
      {successMessage.show && (
        <div className={styles.successMessage}>{successMessage.text}</div>
      )}

      {/* Main Table Content - Now fills the area */}
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
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <i className="fas fa-users-slash" style={{ fontSize: '24px', marginBottom: '12px', display: 'block', color: '#9ca3af' }}></i>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '500' }}>{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className={getRoleBadgeClass(u.role)}>{u.role}</span></td>
                  <td>{u.domain_name}</td>
                  <td>
                    <span className={u.is_active ? styles.statusActive : styles.statusInactive}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.btnEdit} onClick={() => handleEditClick(u)}>
                      <i className="fas fa-edit" style={{ marginRight: '4px' }}></i>
                      Edit
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDeleteInit(u)}>
                      <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
         <div className={styles.modalOverlay}>
             <div className={styles.modalContent}>
                 <h3 style={{ marginTop: '0', marginBottom: '20px' }}>Create New User</h3>
                 {/* Role Selection UI */}
                 {!createRole ? (
                    <div className={styles.roleSelection}>
                        <button onClick={() => setCreateRole('student')} className={styles.roleBtn}>
                          <i className="fas fa-user-graduate" style={{ marginRight: '8px' }}></i>
                          Student
                        </button>
                        <button onClick={() => setCreateRole('trainer')} className={styles.roleBtn}>
                          <i className="fas fa-chalkboard-teacher" style={{ marginRight: '8px' }}></i>
                          Trainer
                        </button>
                        <button onClick={() => setCreateRole('admin')} className={styles.roleBtn}>
                          <i className="fas fa-user-shield" style={{ marginRight: '8px' }}></i>
                          Admin
                        </button>
                        <button onClick={() => setShowCreateModal(false)} className={styles.btnCancel} style={{ marginTop: '10px' }}>
                          Cancel
                        </button>
                    </div>
                 ) : (
                    <form onSubmit={handleCreateSubmit}>
                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input 
                              type="email" 
                              value={newUser.email} 
                              onChange={e => setNewUser({...newUser, email: e.target.value})} 
                              required 
                              placeholder="user@example.com"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Username *</label>
                            <input 
                              type="text" 
                              value={newUser.username} 
                              onChange={e => setNewUser({...newUser, username: e.target.value})} 
                              required 
                              placeholder="johndoe"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Password *</label>
                            <input 
                              type="password" 
                              value={newUser.password} 
                              onChange={e => setNewUser({...newUser, password: e.target.value})} 
                              required 
                              placeholder="Minimum 8 characters"
                            />
                        </div>
                        {(createRole !== 'admin') && (
                            <div className={styles.formGroup}>
                                <label>Domain *</label>
                                <select value={newUser.domain_id} onChange={e => setNewUser({...newUser, domain_id: e.target.value})} required>
                                    <option value="">Select Domain</option>
                                    {domainOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.btnCancel} onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button type="submit" className={styles.btnPrimary} disabled={loading}>
                              {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                 )}
             </div>
         </div>
      )}
      
      {showEditModal && selectedUser && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3 style={{ marginTop: '0', marginBottom: '20px' }}>Edit User</h3>
                <form onSubmit={handleEditSubmit}>
                    <div className={styles.formGroup}>
                        <label>Username</label>
                        <input 
                          type="text" 
                          value={selectedUser.username} 
                          onChange={e => setSelectedUser({...selectedUser, username: e.target.value})} 
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input 
                          type="email" 
                          value={selectedUser.email} 
                          onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} 
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Domain</label>
                        <select 
                          value={selectedUser.domain_id || ''} 
                          onChange={e => setSelectedUser({...selectedUser, domain_id: e.target.value})}
                        >
                            <option value="">No Domain</option>
                            {domainOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnCancel} onClick={() => setShowEditModal(false)}>Cancel</button>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3 style={{ marginTop: '0', marginBottom: '16px', color: '#ef4444' }}>Confirm Delete</h3>
                <p style={{ marginBottom: '24px' }}>
                  Are you sure you want to delete user <strong>"{deleteData.username}"</strong>? This action cannot be undone.
                </p>
                <div className={styles.modalActions}>
                    <button onClick={() => setShowDeleteModal(false)} className={styles.btnCancel}>Cancel</button>
                    <button onClick={handleDeleteConfirm} className={styles.btnDelete} disabled={loading}>
                      {loading ? 'Deleting...' : 'Delete User'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;