import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard'; // Import New Dashboard
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
              <Route path="/student-dashboard" element={<StudentDashboard />} /> {/* New Route */}
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
  } else if (userRole === 'student') {
    // Note: If you want strict checking on page refresh, you might redirect to 
    // profile first or handle logic here. For now, sending to dashboard is standard.
    // If the profile is missing, the dashboard API calls might fail, or you can 
    // add a check here similar to Login.jsx if needed.
    return <Navigate to="/student-dashboard" replace />;
  } else if (userRole === 'trainer') {
    return <Navigate to="/profile" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

export default App;
