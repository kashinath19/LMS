import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import StudentDashboard from './pages/StudentDashboard';
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
            
            {/* Protected routes - Use PrivateRoute as layout */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
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

// Component to handle dashboard redirection
function NavigateToDashboard() {
  const userRole = localStorage.getItem('user_role');
  
  if (userRole === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (userRole === 'trainer') {
    return <Navigate to="/trainer-dashboard" replace />;
  } else if (userRole === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

export default App;