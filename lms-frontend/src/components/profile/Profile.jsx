import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentProfile from './StudentProfile';
import TrainerProfile from './TrainerProfile';
import './Profile.css';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = React.useState({ type: '', text: '' });
  const [profileExists, setProfileExists] = React.useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const handleProfileCreated = () => {
    setProfileExists(true);
  };

  // Wait until auth initialization completes before deciding which profile component to render
  if (authLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  // Admin fallback view (dynamic name)
  if (user?.role === 'admin') {
    const adminName = user?.username || (user?.email ? user.email.split('@')[0] : 'Administrator');
    return (
      <div className="profile-card">
        <div className="form-container">
          <h3>Welcome, {adminName}!</h3>
          <p>You have full access to manage the LMS system.</p>
          <p>Navigate to dashboard for administration features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-content">
      {message.text && (
        <div className="message-container">
          <div className={`message ${message.type}`}>{message.text}</div>
        </div>
      )}

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
