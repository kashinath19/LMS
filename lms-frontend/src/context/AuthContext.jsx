import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { profileAPI } from '../services/api';

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
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    const obj = JSON.parse(json);
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

  // Fetch admin profile once and merge into user state
  const fetchAdminProfileOnce = async (currentToken) => {
    try {
      if (!currentToken) currentToken = localStorage.getItem('access_token');
      if (!currentToken) return;

      axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;

      const res = await profileAPI.getAdminProfile();
      const data = res?.data ?? res;

      // Normalize possible shapes
      const payload = (data?.data && typeof data.data === 'object') ? data.data : (data?.admin || data?.profile || data);

      const name = payload?.name || payload?.full_name || payload?.first_name || payload?.username || null;
      const email = payload?.email || localStorage.getItem('user_email') || null;
      const avatarUrl = payload?.avatarUrl || payload?.avatar || payload?.profile_image || null;
      const initials = (payload?.initials) ? payload.initials : (name ? name.split(' ').map(n => n[0]).slice(0,2).join('') : null);

      setUser(prev => ({
        ...(prev || {}),
        name: name ?? prev?.name,
        email: email ?? prev?.email,
        avatarUrl: avatarUrl ?? prev?.avatarUrl,
        initials: initials ?? prev?.initials
      }));

      if (name) localStorage.setItem('user_name', name);
      if (email) localStorage.setItem('user_email', email);
      if (payload?.id) localStorage.setItem('user_id', payload.id);
    } catch (err) {
      console.warn('AuthContext - fetchAdminProfileOnce failed:', err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedRole = localStorage.getItem('user_role');
      const storedEmail = localStorage.getItem('user_email');
      const storedUserId = localStorage.getItem('user_id');
      const storedName = localStorage.getItem('user_name');

      if (storedToken && storedRole && storedEmail) {
        setUser({
          role: storedRole,
          email: storedEmail,
          id: storedUserId || null,
          token: storedToken,
          name: storedName || null,
        });
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        if (storedRole === 'admin') {
          await fetchAdminProfileOnce(storedToken);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, role) => {
    try {
      const endpoints = {
        admin: '/auth/login-admin',
        trainer: '/auth/login-trainer',
        student: '/auth/login-student'
      };

      const response = await axios.post(
        `${API_BASE_URL}${endpoints[role]}`,
        { email, password }
      );

      const { access_token, refresh_token } = response.data;

      let userId =
        response.data?.user?.id ||
        response.data?.user_id ||
        response.data?.id ||
        response.data?.user?.user_id ||
        response.data?.user?.userId ||
        null;

      if (!userId && access_token) {
        const decodedId = tryDecodeJwtForId(access_token);
        if (decodedId) userId = decodedId;
      }

      if (access_token) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token || '');
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', email);
        if (userId) localStorage.setItem('user_id', userId);
        else localStorage.removeItem('user_id');
      }

      setToken(access_token);
      setUser({
        role,
        email,
        id: userId || null,
        token: access_token
      });

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      if (role === 'admin') {
        await fetchAdminProfileOnce(access_token);
      }

      return {
        success: true,
        data: response.data,
        role: role
      };
    } catch (error) {
      console.error('AuthContext - Login error:', error);
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');

    sessionStorage.clear();

    setUser(null);
    setToken(null);

    delete axios.defaults.headers.common['Authorization'];

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
