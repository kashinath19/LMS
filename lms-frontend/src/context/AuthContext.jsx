import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function tryDecodeJwtForId(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // add padding for base64 if needed
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    const obj = JSON.parse(json);
    // common claim names for id
    return obj?.sub || obj?.user_id || obj?.id || obj?.uid || null;
  } catch (e) {
    console.warn('AuthContext - JWT decode failed:', e);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthContext - Initializing auth...');
      const storedToken = localStorage.getItem('access_token');
      const storedRole = localStorage.getItem('user_role');
      const storedEmail = localStorage.getItem('user_email');
      const storedUserId = localStorage.getItem('user_id');

      console.log('AuthContext - Stored token:', storedToken ? 'Present' : 'Missing');
      console.log('AuthContext - Stored role:', storedRole);
      console.log('AuthContext - Stored email:', storedEmail);
      console.log('AuthContext - Stored user id:', storedUserId);

      if (storedToken && storedRole && storedEmail) {
        console.log('AuthContext - Setting user from localStorage');
        setUser({
          role: storedRole,
          email: storedEmail,
          id: storedUserId || null,
          token: storedToken
        });
        setToken(storedToken);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } else {
        console.log('AuthContext - No valid auth data in localStorage');
      }

      setLoading(false);
      console.log('AuthContext - Loading set to false');
    };

    initializeAuth();
  }, []);

  const login = async (email, password, role) => {
    console.log('AuthContext - Login called with:', { email, role });
    try {
      const endpoints = {
        admin: '/auth/login-admin',
        trainer: '/auth/login-trainer',
        student: '/auth/login-student'
      };

      console.log('AuthContext - Making API call to:', endpoints[role]);
      const response = await axios.post(
        `${API_BASE_URL}${endpoints[role]}`,
        { email, password }
      );

      console.log('AuthContext - Login response:', response.data);
      const { access_token, refresh_token } = response.data;

      // Try to extract user id from common response shapes
      let userId =
        response.data?.user?.id ||
        response.data?.user_id ||
        response.data?.id ||
        response.data?.user?.user_id ||
        response.data?.user?.userId ||
        null;

      // If not found in response body, try decoding JWT payload
      if (!userId && access_token) {
        const decodedId = tryDecodeJwtForId(access_token);
        if (decodedId) {
          userId = decodedId;
          console.log('AuthContext - Extracted user id from JWT:', userId);
        } else {
          console.log('AuthContext - No user id found in JWT payload');
        }
      } else if (userId) {
        console.log('AuthContext - Extracted user id from response body:', userId);
      }

      // Store tokens and basic user info
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token || '');
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', email);

        if (userId) {
          localStorage.setItem('user_id', userId);
          console.log('AuthContext - user_id stored:', userId);
        } else {
          // remove any stale user_id to avoid incorrect checks
          localStorage.removeItem('user_id');
        }
      }

      console.log('AuthContext - Tokens stored in localStorage');
      console.log('AuthContext - Role stored:', role);

      // Update state
      setToken(access_token);
      setUser({
        role,
        email,
        id: userId || null,
        token: access_token
      });

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      console.log('AuthContext - Axios header set');

      return {
        success: true,
        data: response.data,
        role: role
      };
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      console.error('AuthContext - Error response:', error.response?.data);

      let errorMessage = 'Login failed';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    console.log('AuthContext - Logout called');
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user_id');

    // Clear session storage as well
    sessionStorage.clear();

    // Clear state
    setUser(null);
    setToken(null);

    // Remove axios header
    delete axios.defaults.headers.common['Authorization'];

    console.log('AuthContext - User logged out, redirecting to login');
    // Redirect to login
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  console.log('AuthContext - Current auth state:', {
    user,
    loading,
    isAuthenticated: !!token && !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;