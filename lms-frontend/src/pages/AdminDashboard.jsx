import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ show: false, text: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // domain options loaded from API (fallback to static)
  const [domainOptions, setDomainOptions] = useState([
    { id: '1', name: 'Data Science' },
    { id: '2', name: 'Full Stack Development' },
    { id: '3', name: 'Cybersecurity' },
    { id: '4', name: 'Artificial Intelligence' }
  ]);

  // admin users list
  const [adminUsers, setAdminUsers] = useState([]);

  // Trainer form data
  const [trainerForm, setTrainerForm] = useState({
    email: '',
    username: '',
    password: '',
    domain_id: ''
  });

  // Student form data
  const [studentForm, setStudentForm] = useState({
    email: '',
    username: '',
    password: '',
    domain_id: ''
  });

  // Admin form data (new)
  const [adminForm, setAdminForm] = useState({
    email: '',
    username: '',
    password: '',
    domain_id: ''
  });

  useEffect(() => {
    // Fetch domains from API on mount, use fallback on failure,
    // and fetch admin users list.
    const fetchDomains = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`${API_BASE_URL}/domains`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (Array.isArray(res.data)) {
          setDomainOptions(res.data.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id })));
        } else if (res.data?.results && Array.isArray(res.data.results)) {
          setDomainOptions(res.data.results.map(d => ({ id: d.id, name: d.name || d.title || d.label || d.id })));
        } else {
          console.warn('Domains response shape unexpected:', res.data);
        }
      } catch (err) {
        console.warn('Could not fetch domains, using fallback list.', err?.response?.data || err.message);
      }
    };

    const fetchAdminUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`${API_BASE_URL}/users`, {
          params: { role: 'admin' },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        // handle array or results
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAdminUsers(list);
      } catch (err) {
        console.warn('Could not fetch admin users:', err?.response?.data || err.message);
      }
    };

    fetchDomains();
    fetchAdminUsers();
  }, []);

  const handleTrainerChange = (e) => {
    const { name, value } = e.target;
    setTrainerForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const showSuccess = (message) => {
    setSuccessMessage({ show: true, text: message });
    setTimeout(() => setSuccessMessage({ show: false, text: '' }), 5000);
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
    // domain_id optional for admins
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

  // Helper: normalize domain_id to null / number / string
  const normalizeDomainId = (id) => {
    if (id === '' || id == null) return null;
    if (/^\d+$/.test(String(id))) return Number(id);
    return id;
  };

  // Helper: parse backend validation errors (FastAPI-like or custom)
  const parseValidationErrors = (respData) => {
    const newErrors = {};
    if (!respData) return newErrors;

    // FastAPI/Pydantic style: detail = [{ loc: [...], msg: '...', type: '...'}, ...]
    if (Array.isArray(respData.detail)) {
      respData.detail.forEach(err => {
        const loc = err.loc || [];
        const msg = err.msg || (err.message ?? 'Invalid value');
        // try to map to field names
        if (loc.includes('email')) newErrors.email = msg;
        else if (loc.includes('username')) newErrors.username = msg;
        else if (loc.includes('password')) newErrors.password = msg;
        else if (loc.includes('domain') || loc.includes('domain_id')) newErrors.domain_id = msg;
        else if (typeof err === 'string') newErrors.general = err;
        else newErrors.general = newErrors.general ? `${newErrors.general}; ${msg}` : msg;
      });
      return newErrors;
    }

    // Simple string detail
    if (typeof respData.detail === 'string') {
      if (respData.detail.toLowerCase().includes('domain')) newErrors.domain_id = respData.detail;
      else newErrors.general = respData.detail;
      return newErrors;
    }

    // Generic object with field->message
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

  const registerTrainer = async () => {
    if (!validateTrainerForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const trainerData = {
        email: trainerForm.email,
        username: trainerForm.username,
        password: trainerForm.password,
        domain_id: normalizeDomainId(trainerForm.domain_id)
      };

      const response = await axios.post(
        `${API_BASE_URL}/auth/register-trainer`,
        trainerData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Trainer registered:', response.data);
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
      } else if (status === 400) {
        showSuccess('Failed to register trainer. Please check your inputs.');
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
      const token = localStorage.getItem('access_token');

      const studentData = {
        email: studentForm.email,
        username: studentForm.username,
        password: studentForm.password,
        domain_id: normalizeDomainId(studentForm.domain_id)
      };

      const response = await axios.post(
        `${API_BASE_URL}/auth/register-student`,
        studentData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Student registered:', response.data);
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
      const token = localStorage.getItem('access_token');

      const adminData = {
        email: adminForm.email,
        username: adminForm.username,
        password: adminForm.password
      };

      const response = await axios.post(
        `${API_BASE_URL}/auth/register-admin`,
        adminData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Admin registered:', response.data);
      showSuccess(`Admin '${adminForm.username}' has been registered successfully.`);
      setAdminForm({ email: '', username: '', password: '' });
      setAdminModalOpen(false);
      setErrors({});

      // refresh admin users list so sidebar shows updated info
      try {
        const res = await axios.get(`${API_BASE_URL}/users`, {
          params: { role: 'admin' },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
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

  const getAdminInitials = () => {
    // prefer username of current admin (from adminUsers); fallback to email initials
    const current = adminUsers.find(u => u.email === user?.email) || null;
    const name = current?.username || user?.email?.split('@')[0] || 'AD';
    return name.substring(0, 2).toUpperCase() || 'AD';
  };

  const currentAdminDisplay = () => {
    const current = adminUsers.find(u => u.email === user?.email) || null;
    if (current) {
      return {
        displayName: current.username || current.email || (user?.email?.split('@')[0] || 'Admin'),
        displayEmail: current.email || user?.email || ''
      };
    }
    // fallbacks
    return {
      displayName: user?.email?.split('@')[0] || 'Admin',
      displayEmail: user?.email || ''
    };
  };

  const { displayName, displayEmail } = currentAdminDisplay();

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <i className="fas fa-graduation-cap"></i>
          <span className="logo-text">LMS Portal</span>
        </div>

        <div className="nav-links">
          <a href="#" className="nav-item active">
            <i className="fas fa-tachometer-alt"></i>
            <span className="nav-text">Dashboard</span>
          </a>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getAdminInitials()}</div>
            <div className="user-details">
              <div className="user-name">{displayName}</div>
              <div className="user-role">{displayEmail}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">Administrator Dashboard</h1>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setTrainerModalOpen(true)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Create Trainer
            </button>
            <button
              className="btn btn-success"
              onClick={() => setStudentModalOpen(true)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Create Student
            </button>

            <button
              className="btn btn-warning"
              onClick={() => setAdminModalOpen(true)}
              disabled={loading}
              title="Create Admin"
            >
              <i className="fas fa-user-shield"></i>
              Create Admin
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage.show && (
          <div className="success-message show">
            <i className="fas fa-check-circle"></i>
            <div>{successMessage.text}</div>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="dashboard-cards">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Trainers</h3>
              <div className="card-icon trainer-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
            </div>
            <div className="card-value">Manage Trainers</div>
            <div className="card-change">
              Use "Create Trainer" button to register new trainers
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Students</h3>
              <div className="card-icon student-icon">
                <i className="fas fa-users"></i>
              </div>
            </div>
            <div className="card-value">Manage Students</div>
            <div className="card-change">
              Use "Create Student" button to register new students
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="info-section">
          <h2>Admin Controls</h2>
          <p>As an administrator, you can:</p>
          <ul>
            <li>Register new trainers with domain assignments</li>
            <li>Register new students (domain assignment is optional)</li>
            <li>Register new admins (admin-only)</li>
            <li>Manage user accounts and permissions</li>
            <li>Monitor system activity</li>
          </ul>
        </div>
      </div>

      {/* Create Trainer Modal */}
      {trainerModalOpen && (
        <div className="modal active" onClick={(e) => e.target.className === 'modal active' && setTrainerModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Trainer</h3>
              <button className="close-modal" onClick={() => setTrainerModalOpen(false)} disabled={loading}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form id="trainerForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="trainerEmail">Email Address *</label>
                  <input
                    type="email"
                    id="trainerEmail"
                    name="email"
                    className="form-input"
                    placeholder="trainer@example.com"
                    value={trainerForm.email}
                    onChange={handleTrainerChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {errors.email && <div className="form-error show">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="trainerUsername">Username *</label>
                  <input
                    type="text"
                    id="trainerUsername"
                    name="username"
                    className="form-input"
                    placeholder="Enter a username (min. 3 characters)"
                    value={trainerForm.username}
                    onChange={handleTrainerChange}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && <div className="form-error show">{errors.username}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="trainerPassword">Password *</label>
                  <input
                    type="password"
                    id="trainerPassword"
                    name="password"
                    className="form-input"
                    placeholder="Enter a secure password (min. 8 characters)"
                    value={trainerForm.password}
                    onChange={handleTrainerChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && <div className="form-error show">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="trainerDomain">Assign to Domain *</label>
                  <select
                    id="trainerDomain"
                    name="domain_id"
                    className="form-input"
                    value={trainerForm.domain_id}
                    onChange={handleTrainerChange}
                    disabled={loading}
                  >
                    <option value="">Select a domain</option>
                    {domainOptions.map(domain => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  {errors.domain_id && <div className="form-error show">{errors.domain_id}</div>}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTrainerModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={registerTrainer} disabled={loading}>
                {loading ? 'Registering...' : 'Register Trainer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {studentModalOpen && (
        <div className="modal active" onClick={(e) => e.target.className === 'modal active' && setStudentModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Student</h3>
              <button className="close-modal" onClick={() => setStudentModalOpen(false)} disabled={loading}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form id="studentForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="studentEmail">Email Address *</label>
                  <input
                    type="email"
                    id="studentEmail"
                    name="email"
                    className="form-input"
                    placeholder="student@example.com"
                    value={studentForm.email}
                    onChange={handleStudentChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {errors.email && <div className="form-error show">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="studentUsername">Username *</label>
                  <input
                    type="text"
                    id="studentUsername"
                    name="username"
                    className="form-input"
                    placeholder="Enter a username (min. 3 characters)"
                    value={studentForm.username}
                    onChange={handleStudentChange}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && <div className="form-error show">{errors.username}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="studentPassword">Password *</label>
                  <input
                    type="password"
                    id="studentPassword"
                    name="password"
                    className="form-input"
                    placeholder="Enter a secure password (min. 8 characters)"
                    value={studentForm.password}
                    onChange={handleStudentChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && <div className="form-error show">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="studentDomain">Assign to Domain (Optional)</label>
                  <select
                    id="studentDomain"
                    name="domain_id"
                    className="form-input"
                    value={studentForm.domain_id}
                    onChange={handleStudentChange}
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
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStudentModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={registerStudent} disabled={loading}>
                {loading ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {adminModalOpen && (
        <div className="modal active" onClick={(e) => e.target.className === 'modal active' && setAdminModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Admin</h3>
              <button className="close-modal" onClick={() => setAdminModalOpen(false)} disabled={loading}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form id="adminForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="adminEmail">Email Address *</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="email"
                    className="form-input"
                    placeholder="admin@example.com"
                    value={adminForm.email}
                    onChange={handleAdminChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {errors.email && <div className="form-error show">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="adminUsername">Username *</label>
                  <input
                    type="text"
                    id="adminUsername"
                    name="username"
                    className="form-input"
                    placeholder="Enter a username (min. 3 characters)"
                    value={adminForm.username}
                    onChange={handleAdminChange}
                    autoComplete="username"
                    disabled={loading}
                  />
                  {errors.username && <div className="form-error show">{errors.username}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="adminPassword">Password *</label>
                  <input
                    type="password"
                    id="adminPassword"
                    name="password"
                    className="form-input"
                    placeholder="Enter a secure password (min. 8 characters)"
                    value={adminForm.password}
                    onChange={handleAdminChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {errors.password && <div className="form-error show">{errors.password}</div>}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAdminModalOpen(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={registerAdmin} disabled={loading}>
                {loading ? 'Registering...' : 'Register Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;