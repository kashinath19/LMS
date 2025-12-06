import { authAPI } from './api';

export const login = async (email, password, role) => {
  try {
    const response = await authAPI.login(email, password, role);
    
    if (response.data.access_token) {
      // Store tokens
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token || '');
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_email', email);
      
      // Calculate token expiry (assuming 1 hour expiry)
      const expiryTime = Date.now() + (60 * 60 * 1000);
      localStorage.setItem('token_expiry', expiryTime.toString());
    }
    
    return {
      success: true,
      data: response.data,
      role: role,
      email: email
    };
  } catch (error) {
    console.error('Login service error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || 
             error.response?.data?.message || 
             'Login failed. Please check your credentials.'
    };
  }
};

export const logout = () => {
  // Clear all stored data
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  localStorage.removeItem('token_expiry');
  
  // Remove from session storage as well
  sessionStorage.clear();
  
  // Redirect to login page
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  const expiry = localStorage.getItem('token_expiry');
  
  if (!token) return false;
  
  // Check if token is expired
  if (expiry && Date.now() > parseInt(expiry)) {
    logout();
    return false;
  }
  
  return true;
};

export const getCurrentUser = () => {
  const role = localStorage.getItem('user_role');
  const email = localStorage.getItem('user_email');
  const token = localStorage.getItem('access_token');
  
  if (!role || !email || !token) return null;
  
  return {
    role,
    email,
    token
  };
};