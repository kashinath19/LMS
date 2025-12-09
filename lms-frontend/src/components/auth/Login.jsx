import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const getPlaceholderEmail = (selectedRole) => {
    const placeholders = {
      admin: 'admin@institution.edu',
      trainer: 'trainer@institution.edu',
      student: 'student@institution.edu'
    };
    return placeholders[selectedRole] || '';
  };

  const getRoleLabel = (selectedRole) => {
    const labels = {
      admin: 'Administrator Access',
      trainer: 'Trainer Access',
      student: 'Student Access'
    };
    return labels[selectedRole] || '';
  };

  const getRoleIcon = (selectedRole) => {
    const icons = {
      admin: 'fa-user-shield',
      trainer: 'fa-chalkboard-teacher',
      student: 'fa-user-graduate'
    };
    return icons[selectedRole] || 'fa-user';
  };

  const handleRoleChange = (newRole) => {
    console.log('Login - Role changed to:', newRole);
    setRole(newRole);
    setEmail('');
    setPassword('');
    setError('');
  };

  // Returns { ok: boolean, exists?: boolean, status?: number, message?: string }
  const checkProfileExists = async (role, userId, token) => {
    if (!userId) {
      // No user id stored — treat as "profile not present" (redirect to /profile flow)
      return { ok: true, exists: false };
    }
    const endpointRole = role === 'trainer' ? 'trainer' : 'student';
    const url = `${API_BASE_URL}/profiles/${endpointRole}/${userId}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        return { ok: true, exists: true };
      }

      // 404 => profile not found (ok, exists: false)
      if (res.status === 404) {
        return { ok: true, exists: false };
      }

      // For 401/403 and other non-OK statuses, try to get a message
      let msg = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.detail) msg = body.detail;
        else if (body?.message) msg = body.message;
        else if (typeof body === 'string') msg = body;
      } catch (e) {
        // ignore JSON parse error
      }
      return { ok: false, status: res.status, message: msg };
    } catch (err) {
      console.error('Error checking profile existence:', err);
      return { ok: false, message: err.message || 'Network error while checking profile' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    console.log('Login - Attempting login with:', { email, role });

    try {
      const result = await login(email, password, role);

      if (!result || !result.success) {
        console.log('Login - Login failed:', result?.error || 'Unknown error from login');
        setError(result?.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Login succeeded at auth level. Check for profile only for trainer/student.
      const storedUserId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');
      console.log('Login - storedUserId:', storedUserId, 'token present:', !!token);

      let redirectPath = '/profile';

      if (role === 'admin') {
        redirectPath = '/admin-dashboard';
      } else if (role === 'trainer' || role === 'student') {
        const profileCheck = await checkProfileExists(role, storedUserId, token);
        if (!profileCheck.ok) {
          // Important: do NOT navigate; show the error card instead.
          const message = profileCheck.message || (profileCheck.status ? `Error ${profileCheck.status}` : 'Unauthorized');
          console.warn('Login - Profile check error:', message);
          setError(typeof message === 'string' ? message : 'Unauthorized');
          setLoading(false);
          return;
        }

        // profileCheck.ok === true
        redirectPath = profileCheck.exists ? (role === 'trainer' ? '/trainer-dashboard' : '/student-dashboard') : '/profile';
      }

      console.log('Login - Redirecting to:', redirectPath);
      // small timeout to ensure state is set, then navigate
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 50);
    } catch (error) {
      console.error('Login - Unexpected error:', error);
      setError(error?.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left: Brand Section */}
      <div className="brand-section">
        <div className="logo">
          <div className="logo-icon">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div className="logo-text">LMS Portal</div>
        </div>

        <h1 className="brand-title">Learning Management System</h1>
        <p className="brand-description">
          A comprehensive platform designed for educational institutions to manage courses, track progress, and facilitate learning.
        </p>

        <div className="features">
          <div className="feature">
            <i className="fas fa-shield-alt"></i>
            <span>Secure authentication</span>
          </div>
          <div className="feature">
            <i className="fas fa-chart-line"></i>
            <span>Progress analytics</span>
          </div>
          <div className="feature">
            <i className="fas fa-users"></i>
            <span>Role-based access</span>
          </div>
        </div>
      </div>

      {/* Right: Login Section */}
      <div className="login-section">
        <div className="login-header">
          <h1 className="login-title">Secure Login</h1>
          <p className="login-subtitle">Access your personalized dashboard with your credentials</p>
          <div className="role-indicator">
            <i className={`fas ${getRoleIcon(role)}`}></i>
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        {/* Role Selection */}
        <div className="role-selection">
          <div className="role-label">
            <i className="fas fa-user-tag"></i>
            Select Access Level
          </div>
          <div className="role-buttons">
            <button
              className={`role-btn admin ${role === 'admin' ? 'active' : ''}`}
              onClick={() => handleRoleChange('admin')}
              type="button"
              disabled={loading}
            >
              <i className="fas fa-user-shield"></i>
              <span>Administrator</span>
            </button>
            <button
              className={`role-btn trainer ${role === 'trainer' ? 'active' : ''}`}
              onClick={() => handleRoleChange('trainer')}
              type="button"
              disabled={loading}
            >
              <i className="fas fa-chalkboard-teacher"></i>
              <span>Trainer</span>
            </button>
            <button
              className={`role-btn student ${role === 'student' ? 'active' : ''}`}
              onClick={() => handleRoleChange('student')}
              type="button"
              disabled={loading}
            >
              <i className="fas fa-user-graduate"></i>
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-container">
              <i className="input-icon fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder={getPlaceholderEmail(role)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-container">
              <i className="input-icon fas fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input"
                placeholder="Enter your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                autoComplete="off"
                disabled={loading}
              />
              <span>Keep me signed in</span>
            </label>
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                <span>Sign In</span>
              </>
            )}
          </button>

          <div className="signup-link">
            Need platform access? <a href="#">Contact system administrator</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;