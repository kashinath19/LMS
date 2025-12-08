import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement'; // Ensure this file exists at this path
import StudentDashboard from './pages/student/StudentDashboard';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

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
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />

              {/* Student Routes */}
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              
              {/* Default Redirect */}
              <Route path="/" element={<NavigateToDashboard />} />
            </Route>
            
            {/* Catch-all 404 - This is what you are seeing right now */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

// Component to handle dashboard redirection
function NavigateToDashboard() {
  const userRole = localStorage.getItem('user_role');
  
  if (userRole === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (userRole === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  } else if (userRole === 'trainer') {
    return <Navigate to="/profile" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

export default App;