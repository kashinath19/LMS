import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentProfile from './StudentProfile';
import TrainerProfile from './TrainerProfile';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    // Set initial loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const handleProfileCreated = () => {
    setProfileExists(true);
  };

  if (loading) {
    return (
      <div className="loading">
        Loading profile...
      </div>
    );
  }

  // Admin should not see profile page - should be redirected to dashboard
  // This is a fallback in case admin navigates to /profile
  if (user?.role === 'admin') {
    return (
      <div className="profile-container">
        <div className="page-header">
          <div className="page-title">
            <h1>Administrator Dashboard</h1>
            <p>This is the admin dashboard area</p>
          </div>
          <div className="header-right">
            <div className="user-role-badge">Administrator</div>
            <button 
              className="btn btn-secondary logout-btn"
              onClick={logout}
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
        <div className="profile-card">
          <div className="form-container">
            <h3>Welcome, Administrator!</h3>
            <p>You have full access to manage the LMS system.</p>
            <p>Navigate to dashboard for administration features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1 id="pageTitle">
            {user?.role === 'student' ? 'Student Profile' : 'Trainer Profile'}
          </h1>
          <p id="pageSubtitle">
            {profileExists ? 'View and update your profile' : 'Please complete your profile'}
          </p>
        </div>
        <div className="header-right">
          <div className="user-role-badge" id="roleBadge">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </div>
          <button 
            className="btn btn-secondary logout-btn"
            onClick={logout}
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className="message-container">
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="profile-card" id="profileCard">
        {user?.role === 'student' ? (
          <StudentProfile 
            showMessage={showMessage} 
            onProfileCreated={handleProfileCreated}
            profileExists={profileExists}
            setProfileExists={setProfileExists}
          />
        ) : (
          <TrainerProfile 
            showMessage={showMessage} 
            onProfileCreated={handleProfileCreated}
            profileExists={profileExists}
            setProfileExists={setProfileExists}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;