import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  const hasStoredAuth =
    localStorage.getItem('access_token') &&
    localStorage.getItem('user_role') &&
    localStorage.getItem('user_email');

  const isAuthorized = isAuthenticated || hasStoredAuth;

  return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
