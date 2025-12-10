import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import styles from './Login.module.css';

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

  const checkProfileExists = async (role, userId, token) => {
    if (!userId) {
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

      if (res.status === 404) {
        return { ok: true, exists: false };
      }

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

      const storedUserId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');
      console.log('Login - storedUserId:', storedUserId, 'token present:', !!token);

      let redirectPath = '/profile';

      if (role === 'admin') {
        redirectPath = '/admin-dashboard';
      } else if (role === 'trainer' || role === 'student') {
        const profileCheck = await checkProfileExists(role, storedUserId, token);
        if (!profileCheck.ok) {
          const message = profileCheck.message || (profileCheck.status ? `Error ${profileCheck.status}` : 'Unauthorized');
          console.warn('Login - Profile check error:', message);
          setError(typeof message === 'string' ? message : 'Unauthorized');
          setLoading(false);
          return;
        }

        redirectPath = profileCheck.exists ? (role === 'trainer' ? '/trainer-dashboard' : '/student-dashboard') : '/profile';
      }

      console.log('Login - Redirecting to:', redirectPath);
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
    <div className={styles.loginContainer}>
      {/* Left: Brand Section */}
      <div className={styles.brandSection}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div className={styles.logoText}>LMS Portal</div>
        </div>

        <h1 className={styles.brandTitle}>Learning Management System</h1>
        <p className={styles.brandDescription}>
          A comprehensive platform designed for educational institutions to manage courses, track progress, and facilitate learning.
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <i className="fas fa-shield-alt"></i>
            <span>Secure authentication</span>
          </div>
          <div className={styles.feature}>
            <i className="fas fa-chart-line"></i>
            <span>Progress analytics</span>
          </div>
          <div className={styles.feature}>
            <i className="fas fa-users"></i>
            <span>Role-based access</span>
          </div>
        </div>
      </div>

      {/* Right: Login Section */}
      <div className={styles.loginSection}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Secure Login</h1>
          <p className={styles.loginSubtitle}>Access your personalized dashboard with your credentials</p>
          <div className={styles.roleIndicator}>
            <i className={`fas ${getRoleIcon(role)}`}></i>
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        {/* Role Selection */}
        <div className={styles.roleSelection}>
          <div className={styles.roleLabel}>
            <i className="fas fa-user-tag"></i>
            Select Access Level
          </div>
          <div className={styles.roleButtons}>
            <button
              className={`${styles.roleBtn} ${styles.admin} ${role === 'admin' ? styles.active : ''}`}
              onClick={() => handleRoleChange('admin')}
              type="button"
              disabled={loading}
            >
              <i className="fas fa-user-shield"></i>
              <span>Administrator</span>
            </button>
            <button
              className={`${styles.roleBtn} ${styles.trainer} ${role === 'trainer' ? styles.active : ''}`}
              onClick={() => handleRoleChange('trainer')}
              type="button"
              disabled={loading}
            >
              <i className="fas fa-chalkboard-teacher"></i>
              <span>Trainer</span>
            </button>
            <button
              className={`${styles.roleBtn} ${styles.student} ${role === 'student' ? styles.active : ''}`}
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
          <div className={styles.errorMessage}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="email">Email Address</label>
            <div className={styles.inputContainer}>
              <i className={`${styles.inputIcon} fas fa-envelope`}></i>
              <input
                type="email"
                id="email"
                className={styles.formInput}
                placeholder={getPlaceholderEmail(role)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="password">Password</label>
            <div className={styles.inputContainer}>
              <i className={`${styles.inputIcon} fas fa-lock`}></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={styles.formInput}
                placeholder="Enter your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className={styles.formOptions}>
            <label className={styles.checkboxContainer}>
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
            <a href="#" className={styles.forgotLink}>Forgot Password?</a>
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                <span>Sign In</span>
              </>
            )}
          </button>

          <div className={styles.signupLink}>
            Need platform access? <a href="#">Contact system administrator</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
