import React from 'react';
import { Navigate, Outlet, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import UserManagement from '../../pages/admin/UserManagement';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  const role = user?.role || localStorage.getItem('user_role');

  if (role === 'admin') {
    return <Outlet />;
  }

  if (role === 'trainer') {
    return <Navigate to="/trainer-dashboard" replace />;
  }
  
  if (role === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

const AdminRoutes = () => {
  return (
    <Route element={<AdminRoute />}>
      {/* No Layout here — each Admin page uses its own Layout */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/domains" element={<Domain />} />
    </Route>
  );
};

export default AdminRoutes;
