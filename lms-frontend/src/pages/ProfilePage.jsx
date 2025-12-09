import React from 'react';
import Profile from '../components/profile/Profile';
import './ProfilePage.css';

const ProfilePage = () => {
  // This route still exists for compatibility, but the page no longer renders a Back button.
  return (
    <div className="profile-page-container">
      <Profile />
    </div>
  );
};

export default ProfilePage;