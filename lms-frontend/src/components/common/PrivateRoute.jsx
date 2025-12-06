import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Fallback: Check localStorage if state hasn't synced yet
  const hasStoredAuth = localStorage.getItem('access_token') && 
                        localStorage.getItem('user_role') && 
                        localStorage.getItem('user_email');

  // Allow access if either context state OR localStorage has valid auth
  const isAuthorized = isAuthenticated || hasStoredAuth;

  // Show loading only if context is still initializing AND we don't have localStorage backup
  if (loading && !hasStoredAuth) {
    return <LoadingSpinner />;
  }

  console.log('PrivateRoute - Auth check:', {
    isAuthenticated,
    hasStoredAuth,
    isAuthorized,
    loading,
    storedToken: localStorage.getItem('access_token') ? 'exists' : 'missing',
    storedRole: localStorage.getItem('user_role'),
    storedEmail: localStorage.getItem('user_email')
  });

  return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;