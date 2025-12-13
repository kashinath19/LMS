import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Role-based Layouts
import AdminLayout from './components/layout/AdminPanelLayouts/AdminLayout';
import StudentLayout from './components/layout/StudentPanelLayouts/StudentLayout';
import TrainerLayout from './components/layout/TrainerPanelLayouts/TrainerLayout';

// Pages
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Domain from './pages/admin/Domain/Domain';
import Topics from './pages/admin/Domain/topics';

import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerProfilePage from './pages/trainer/TrainerProfilePage';
import TrainerCourses from './pages/trainer/TrainerCourses';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentCourses from './pages/student/StudentCourses';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

/**
 * NavigateToDashboard - Redirects to the appropriate dashboard based on user role
 */
function NavigateToDashboard() {
  const userRole = localStorage.getItem('user_role');

  switch (userRole) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'trainer':
      return <Navigate to="/trainer/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>

              {/* Admin routes - uses AdminLayout (with sidebar) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="domains" element={<Domain />} />
                <Route path="domains/:domainId/topics" element={<Topics />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Trainer routes - uses TrainerLayout (with sidebar) */}
              <Route path="/trainer" element={<TrainerLayout />}>
                <Route path="dashboard" element={<TrainerDashboard />} />
                <Route path="profile" element={<TrainerProfilePage />} />
                <Route path="courses" element={<TrainerCourses />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Student routes - uses StudentLayout (with sidebar) */}
              <Route path="/student" element={<StudentLayout />}>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfilePage />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Legacy route redirects for backward compatibility */}
              <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/users" element={<Navigate to="/admin/users" replace />} />
              <Route path="/trainer-dashboard" element={<Navigate to="/trainer/dashboard" replace />} />
              <Route path="/student-dashboard" element={<Navigate to="/student/dashboard" replace />} />

              {/* Generic profile route - redirects based on role */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Default redirect based on role */}
              <Route path="/" element={<NavigateToDashboard />} />
            </Route>

            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;