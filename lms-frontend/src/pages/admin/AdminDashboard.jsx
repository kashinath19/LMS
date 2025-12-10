import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import styles from './AdminDashboard.module.css';

/**
 * AdminDashboard - Main dashboard page for admins
 * Layout is provided by AdminLayout via routing - this component renders content only
 */
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ show: false, text: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [domainOptions, setDomainOptions] = useState([
    { id: '1', name: 'Data Science' },
    { id: '2', name: 'Full Stack Development' },
    { id: '3', name: 'Cybersecurity' },
    { id: '4', name: 'Artificial Intelligence' }
  ]);

  const [adminUsers, setAdminUsers] = useState([]);

  const [trainerForm, setTrainerForm] = useState({
    email: '',
    username: '',
    password: '',
    domain_id: ''
  });

  const [studentForm, setStudentForm] = useState({
    email: '',
    username: '',
    password: '',
    domain_id: ''
  });

  const [adminForm, setAdminForm] = useState({
    email: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    document.title = 'Admin Dashboard';
  }, []);

  // Listen for modal trigger events from header buttons
  useEffect(() => {
    const handleOpenModal = (event) => {
      const { type } = event.detail || {};
      if (type === 'trainer') {
        setErrors({});
        setTrainerForm({ email: '', username: '', password: '', domain_id: '' });
        setTrainerModalOpen(true);
      } else if (type === 'student') {
        setErrors({});
        setStudentForm({ email: '', username: '', password: '', domain_id: '' });
        setStudentModalOpen(true);
      } else if (type === 'admin') {
        setErrors({});
        setAdminForm({ email: '', username: '', password: '' });
        setAdminModalOpen(true);
      }
    };

    window.addEventListener('admin-open-modal', handleOpenModal);
    return () => window.removeEventListener('admin-open-modal', handleOpenModal);
  }, []);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await api.get('/domains');
        if (Array.isArray(res.data)) {
          setDomainOptions(res.data.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id })));
        } else if (res.data?.results && Array.isArray(res.data.results)) {
          setDomainOptions(res.data.results.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id })));
        }
      } catch (err) {
        console.warn('Could not fetch domains, using fallback list.', err?.response?.data || err.message);
      }
    };

    const fetchAdminUsers = async () => {
      try {
        const res = await api.get('/users', { params: { role: 'admin' } });
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAdminUsers(list);
      } catch (err) {
        console.warn('Could not fetch admin users:', err?.response?.data || err.message);
      }
    };

    fetchDomains();
    fetchAdminUsers();
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage({ show: true, text: message });
    setTimeout(() => setSuccessMessage({ show: false, text: '' }), 5000);
  };

  const normalizeDomainId = (id) => {
    if (id === '' || id == null) return null;
    if (/^\d+$/.test(String(id))) return Number(id);
    return id;
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

  const validateTrainerForm = () => {
    const newErrors = {};
    if (!trainerForm.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(trainerForm.email)) newErrors.email = 'Email is invalid';
    if (!trainerForm.username) newErrors.username = 'Username is required';
    else if (trainerForm.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!trainerForm.password) newErrors.password = 'Password is required';
    else if (trainerForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!trainerForm.domain_id) newErrors.domain_id = 'Domain is required for trainers';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStudentForm = () => {
    const newErrors = {};
    if (!studentForm.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(studentForm.email)) newErrors.email = 'Email is invalid';
    if (!studentForm.username) newErrors.username = 'Username is required';
    else if (studentForm.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!studentForm.password) newErrors.password = 'Password is required';
    else if (studentForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminForm = () => {
    const newErrors = {};
    if (!adminForm.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(adminForm.email)) newErrors.email = 'Email is invalid';
    if (!adminForm.username) newErrors.username = 'Username is required';
    else if (adminForm.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!adminForm.password) newErrors.password = 'Password is required';
    else if (adminForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerTrainer = async () => {
    if (!validateTrainerForm()) return;

    try {
      setLoading(true);
      const trainerData = {
        email: trainerForm.email,
        username: trainerForm.username,
        password: trainerForm.password,
        domain_id: normalizeDomainId(trainerForm.domain_id)
      };
      await api.post('/auth/register-trainer', trainerData);
      showSuccess(`Trainer '${trainerForm.username}' has been registered successfully.`);
      setTrainerForm({ email: '', username: '', password: '', domain_id: '' });
      setTrainerModalOpen(false);
      setErrors({});
    } catch (error) {
      console.error('Error registering trainer:', error?.response?.data || error.message || error);
      const respData = error?.response?.data;
      const status = error?.response?.status;
      const parsed = parseValidationErrors(respData);
      if (Object.keys(parsed).length > 0) {
        setErrors(prev => ({ ...prev, ...parsed }));
      } else if (status === 409) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
      } else {
        showSuccess('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async () => {
    if (!validateStudentForm()) return;

    try {
      setLoading(true);
      const studentData = {
        email: studentForm.email,
        username: studentForm.username,
        password: studentForm.password,
        domain_id: normalizeDomainId(studentForm.domain_id)
      };
      await api.post('/auth/register-student', studentData);
      showSuccess(`Student '${studentForm.username}' has been registered successfully.`);
      setStudentForm({ email: '', username: '', password: '', domain_id: '' });
      setStudentModalOpen(false);
      setErrors({});
    } catch (error) {
      console.error('Error registering student:', error?.response?.data || error.message || error);
      const respData = error?.response?.data;
      const status = error?.response?.status;
      const parsed = parseValidationErrors(respData);
      if (Object.keys(parsed).length > 0) {
        setErrors(prev => ({ ...prev, ...parsed }));
      } else if (status === 409) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
      } else {
        showSuccess('Failed to register student. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async () => {
    if (!validateAdminForm()) return;

    try {
      setLoading(true);
      const adminData = {
        email: adminForm.email,
        username: adminForm.username,
        password: adminForm.password
      };
      await api.post('/auth/register-admin', adminData);
      showSuccess(`Admin '${adminForm.username}' has been registered successfully.`);
      setAdminForm({ email: '', username: '', password: '' });
      setAdminModalOpen(false);
      setErrors({});
      try {
        const res = await api.get('/users/', { params: { role: 'admin' } });
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAdminUsers(list);
      } catch (err) {
        console.warn('Could not refresh admin users after creating admin:', err?.response?.data || err.message);
      }
    } catch (error) {
      console.error('Error registering admin:', error?.response?.data || error.message || error);
      const respData = error?.response?.data;
      const status = error?.response?.status;
      const parsed = parseValidationErrors(respData);
      if (Object.keys(parsed).length > 0) {
        setErrors(prev => ({ ...prev, ...parsed }));
      } else if (status === 409) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
      } else {
        showSuccess('Failed to register admin. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const findCurrentAdmin = () => {
    if (!user) return null;
    if (user.username) return { id: user.id, username: user.username, email: user.email };

    if (user.id != null) {
      const byId = adminUsers.find(u => String(u.id) === String(user.id));
      if (byId) return byId;
    }
    if (user.email) {
      const target = user.email.toString().trim().toLowerCase();
      const byEmail = adminUsers.find(u => (u.email || '').toString().trim().toLowerCase() === target);
      if (byEmail) return byEmail;
    }
    return null;
  };

  const currentAdminDisplay = () => {
    const current = findCurrentAdmin();

    if (current) {
      const name = current.username || (current.email ? current.email.split('@')[0] : current.email);
      return {
        displayName: name || (user?.email?.split('@')[0] || 'Admin'),
        displayEmail: current.email || user?.email || ''
      };
    }

    if (user?.email) {
      return {
        displayName: user.email.split('@')[0],
        displayEmail: user.email
      };
    }

    return { displayName: 'Admin', displayEmail: '' };
  };

  const { displayName, displayEmail } = currentAdminDisplay();

  return (
    <>
      {successMessage.show && (
        <div className={styles.successMessage}>
          <i className="fas fa-check-circle"></i>
          <div>{successMessage.text}</div>
        </div>
      )}

      {/* Empty Dashboard - Cards removed, use header buttons or sidebar to navigate */}
      <div className={styles.emptyDashboard}>
        <div className={styles.emptyIcon}>
          <i className="fas fa-tachometer-alt"></i>
        </div>
        <h2>Admin Dashboard</h2>
        <p>Welcome, <strong>{displayName}</strong></p>
        <p className={styles.emptyText}>
          Use the sidebar to navigate or the header buttons to create new users.
        </p>
      </div>

      {/* Trainer Modal */}
      {trainerModalOpen && (
        <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setTrainerModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Register New Trainer</h3>
              <button className={styles.closeModal} onClick={() => setTrainerModalOpen(false)} disabled={loading}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <form id="trainerForm" onSubmit={(e) => { e.preventDefault(); registerTrainer(); }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="trainerEmail">Email Address *</label>
                  <input
                    type="email"
                    id="trainerEmail"
                    name="email"
                    className={styles.formInput}
                    placeholder="trainer@example.com"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm(prev => ({ ...prev, email: e.target.value }))}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {errors.email && <div className={styles.formError}>{errors.email}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="trainerUsername">Username *</label>
                  <input
                    type="text"
                    id="trainerUsername"
                    name="username"
                    className={styles.formInput}
                    placeholder="Enter a username (min. 3 characters)"
                    value={trainerForm.username}
                    onChange={(e) => setTrainerForm(prev => ({ ...prev, username: e.target.value }))}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && <div className={styles.formError}>{errors.username}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="trainerPassword">Password *</label>
                  <input
                    type="password"
                    id="trainerPassword"
                    name="password"
                    className={styles.formInput}
                    placeholder="Enter a secure password (min. 8 characters)"
                    value={trainerForm.password}
                    onChange={(e) => setTrainerForm(prev => ({ ...prev, password: e.target.value }))}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && <div className={styles.formError}>{errors.password}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="trainerDomain">Assign to Domain *</label>
                  <select
                    id="trainerDomain"
                    name="domain_id"
                    className={styles.formInput}
                    value={trainerForm.domain_id}
                    onChange={(e) => setTrainerForm(prev => ({ ...prev, domain_id: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="">Select a domain</option>
                    {domainOptions.map(domain => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  {errors.domain_id && <div className={styles.formError}>{errors.domain_id}</div>}
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setTrainerModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button className={styles.btnPrimary} onClick={registerTrainer} disabled={loading}>
                {loading ? 'Registering...' : 'Register Trainer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {studentModalOpen && (
        <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setStudentModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Register New Student</h3>
              <button className={styles.closeModal} onClick={() => setStudentModalOpen(false)} disabled={loading}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <form id="studentForm" onSubmit={(e) => { e.preventDefault(); registerStudent(); }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="studentEmail">Email Address *</label>
                  <input
                    type="email"
                    id="studentEmail"
                    name="email"
                    className={styles.formInput}
                    placeholder="student@example.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {errors.email && <div className={styles.formError}>{errors.email}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="studentUsername">Username *</label>
                  <input
                    type="text"
                    id="studentUsername"
                    name="username"
                    className={styles.formInput}
                    placeholder="Enter a username (min. 3 characters)"
                    value={studentForm.username}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, username: e.target.value }))}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && <div className={styles.formError}>{errors.username}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="studentPassword">Password *</label>
                  <input
                    type="password"
                    id="studentPassword"
                    name="password"
                    className={styles.formInput}
                    placeholder="Enter a secure password (min. 8 characters)"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && <div className={styles.formError}>{errors.password}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="studentDomain">Assign to Domain (Optional)</label>
                  <select
                    id="studentDomain"
                    name="domain_id"
                    className={styles.formInput}
                    value={studentForm.domain_id}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, domain_id: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="">Select a domain (optional)</option>
                    {domainOptions.map(domain => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setStudentModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button className={styles.btnSuccess} onClick={registerStudent} disabled={loading}>
                {loading ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {adminModalOpen && (
        <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setAdminModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Register New Admin</h3>
              <button className={styles.closeModal} onClick={() => setAdminModalOpen(false)} disabled={loading}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <form id="adminForm" onSubmit={(e) => { e.preventDefault(); registerAdmin(); }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="adminEmail">Email Address *</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="email"
                    className={styles.formInput}
                    placeholder="admin@example.com"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {errors.email && <div className={styles.formError}>{errors.email}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="adminUsername">Username *</label>
                  <input
                    type="text"
                    id="adminUsername"
                    name="username"
                    className={styles.formInput}
                    placeholder="Enter a username (min. 3 characters)"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && <div className={styles.formError}>{errors.username}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="adminPassword">Password *</label>
                  <input
                    type="password"
                    id="adminPassword"
                    name="password"
                    className={styles.formInput}
                    placeholder="Enter a secure password (min. 8 characters)"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && <div className={styles.formError}>{errors.password}</div>}
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setAdminModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button className={styles.btnWarning} onClick={registerAdmin} disabled={loading}>
                {loading ? 'Registering...' : 'Register Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
