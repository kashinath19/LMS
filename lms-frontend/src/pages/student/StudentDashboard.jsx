import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutGrid, LogOut, Box, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentProfile from '../../components/profile/StudentProfile';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileExists, setProfileExists] = useState(false);
  
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  
  const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

  // Fetch Student Profile Data for header display
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/profiles/student`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Student profile fetched:", data);
        setProfileData(data);
      }
    } catch (error) {
      console.log("Profile not created yet or error loading:", error);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      logout();
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setIsSidebarOpen(false);
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    // Refresh profile data
    fetchProfile();
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const handleProfileCreated = () => {
    setProfileExists(true);
    fetchProfile();
  };

  // Helper to determine which image to show
  const getProfileImage = () => {
    if (profileData && profileData.profile_image_url) {
      return profileData.profile_image_url;
    }
    const seed = profileData?.user_id || user?.email?.split('@')[0] || 'Student';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  // Helper for name display
  const getDisplayName = () => {
    if (profileData && profileData.first_name) {
      return `${profileData.first_name} ${profileData.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Student';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="logo-container">
            <GraduationCap className="logo-icon" size={32} />
            <span className="logo-text">Gigaversity</span>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${!showProfile ? 'active' : ''}`}
              onClick={() => {
                setShowProfile(false);
                setIsSidebarOpen(false);
              }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <LayoutGrid size={20} />
              <span>Dashboard</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-content">
        <header className="top-header">
          <div className="page-title">
            {showProfile ? 'Student Profile' : 'Dashboard'}
          </div>

          {/* Profile Section - Clickable to show profile in dashboard */}
          {!showProfile && (
            <button 
              onClick={handleProfileClick}
              className="profile-section"
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <div className="profile-info">
                <p className="profile-name">{getDisplayName()}</p>
                <p className="profile-role">Student</p>
              </div>
              <div className="profile-avatar">
                <img 
                  src={getProfileImage()} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </button>
          )}

          {showProfile && (
            <button 
              onClick={handleBackToDashboard}
              className="back-button"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem' }}
            >
              <X size={24} />
            </button>
          )}
        </header>

        <main className="content-area">
          {!showProfile ? (
            // Dashboard View
            <div className="empty-state">
              <Box size={48} className="empty-icon" />
              <span className="empty-text">Empty Dashboard</span>
            </div>
          ) : (
            // Profile View - Using StudentProfile Component
            <div className="profile-view-container">
              {message.text && (
                <div className={`message-banner ${message.type}`}>
                  {message.text}
                </div>
              )}
              <StudentProfile 
                showMessage={showMessage}
                onProfileCreated={handleProfileCreated}
                profileExists={profileExists}
                setProfileExists={setProfileExists}
              />
            </div>
          )}
        </main>
      </div>

      <button onClick={toggleSidebar} className="mobile-toggle">
        <Menu size={24} />
      </button>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default StudentDashboard;
