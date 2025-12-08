import React from 'react';
import { useNavigate } from 'react-router-dom';
import Profile from '../components/profile/Profile';
import './ProfilePage.css';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || localStorage.getItem('user_role');

  const handleBackToDashboard = () => {
    if (role === 'admin') {
      navigate('/admin-dashboard');
    } else if (role === 'trainer') {
      navigate('/trainer-dashboard');
    } else if (role === 'student') {
      navigate('/student-dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-breadcrumbs">
        <button className="back-btn" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
      </div>

      <Profile />
    </div>
  );
};

export default ProfilePage;