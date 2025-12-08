import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutGrid, LogOut, Box, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import './TrainerDashboard.css';

const TrainerDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();

  // Fetch Trainer Profile Data on Mount
  const fetchProfile = useCallback(async () => {
    // Need user ID to fetch profile
    const userId = user?.id || localStorage.getItem('user_id');
    
    console.log('TrainerDashboard - Fetching profile for userId:', userId);
    
    if (!userId) {
      console.log("No user ID found, skipping profile fetch");
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/profiles/trainer/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Trainer profile fetched:", data);
        setProfileData(data);
      } else {
        console.error("Failed to fetch trainer profile:", response.status);
      }
    } catch (error) {
      console.error("Error loading trainer profile:", error);
    }
  }, [user]);

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

  // Helper to determine which image to show
  const getProfileImage = () => {
    if (profileData && profileData.profile_image_url) {
      return profileData.profile_image_url;
    }
    // Fallback if no custom image exists
    const seed = profileData?.user_id || user?.email?.split('@')[0] || 'Trainer';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  // Helper for name display
  const getDisplayName = () => {
    if (profileData && profileData.first_name) {
      return `${profileData.first_name} ${profileData.last_name || ''}`;
    }
    return user?.email?.split('@')[0] || 'Trainer';
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
            <Link to="/trainer-dashboard" className="nav-item active">
              <LayoutGrid size={20} />
              <span>Dashboard</span>
            </Link>
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
            Dashboard
          </div>

          {/* Profile Section - Clickable Link to Profile Page */}
          <Link to="/profile" className="profile-section" style={{ textDecoration: 'none' }}>
            <div className="profile-info">
              <p className="profile-name">{getDisplayName()}</p>
              <p className="profile-role">Trainer</p>
            </div>
            <div className="profile-avatar">
              <img 
                src={getProfileImage()} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </Link>
        </header>

        <main className="content-area">
          <div className="empty-state">
            <Box size={48} className="empty-icon" />
            <span className="empty-text">Empty Dashboard</span>
          </div>
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

export default TrainerDashboard;
