import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Profile from '../components/profile/Profile';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Layout configuration
  const navItems = [
    {
      label: 'Dashboard',
      icon: <i className="fas fa-tachometer-alt" />,
      active: false,
      onClick: () => {
        if (user?.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (user?.role === 'trainer') {
          navigate('/trainer-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      },
    },
  ];

  const logo = {
    icon: <i className="fas fa-graduation-cap" />,
    text: 'LMS Portal'
  };

  const footerUser = {
    name: user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
  };

  const profile = {
    name: user?.email?.split('@')[0] || 'User',
    role: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User',
    avatarUrl: null,
    onClick: () => {},
  };

  const title = user?.role === 'student' ? 'Student Profile' : user?.role === 'trainer' ? 'Trainer Profile' : 'Profile';

  return (
    <Layout
      title={title}
      navItems={navItems}
      logo={logo}
      footerUser={footerUser}
      profile={profile}
      onLogout={logout}
    >
      <Profile />
    </Layout>
  );
};

export default ProfilePage;
