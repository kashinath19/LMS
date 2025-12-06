import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

  // Placeholder email based on selected role
  const getPlaceholderEmail = (selectedRole) => {
    const placeholders = {
      admin: 'admin@institution.edu',
      trainer: 'trainer@institution.edu',
      student: 'student@institution.edu'
    };
    return placeholders[selectedRole] || '';
  };

  // Placeholder text for role indicator
  const getRoleLabel = (selectedRole) => {
    const labels = {
      admin: 'Administrator Access',
      trainer: 'Trainer Access',
      student: 'Student Access'
    };
    return labels[selectedRole] || '';
  };

  // Icon for role indicator
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
    // Clear email and password when changing role
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login - Form submitted');
    
    // Clear any previous errors
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    console.log('Login - Attempting login with:', { email, role });

    try {
      const result = await login(email, password, role);
      
      if (result.success) {
        console.log('Login - Login successful, result:', result);
        console.log('Login - Stored token:', localStorage.getItem('access_token'));
        console.log('Login - Stored role:', localStorage.getItem('user_role'));
        console.log('Login - Stored email:', localStorage.getItem('user_email'));
        
        // Determine redirect path based on role
        let redirectPath = '/profile';
        if (role === 'admin') {
          redirectPath = '/admin-dashboard';
        }
        
        console.log('Login - Redirecting to:', redirectPath);
        
        // Use a small delay to ensure state is updated
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 50);
      } else {
        console.log('Login - Login failed:', result.error);
        setError(result.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Login - Unexpected error:', error);
      setError('An unexpected error occurred');
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                <span>Sign In to Dashboard</span>
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