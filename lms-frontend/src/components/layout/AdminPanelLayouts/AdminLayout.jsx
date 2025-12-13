import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import Header from '../Header';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  // State for dynamic header controls
  const [headerComponent, setHeaderComponent] = useState(null);

  // ADDED: State for mobile sidebar drawer toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ADDED: Toggle function for hamburger menu
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const navItems = [
    { label: 'Dashboard', icon: <i className="fas fa-tachometer-alt" />, to: '/admin/dashboard' },
    { label: 'User Management', icon: <i className="fas fa-users-cog" />, to: '/admin/users' },
    { label: 'Domains', icon: <i className="fas fa-layer-group" />, to: '/admin/domains' },
  ].map(item => ({
    label: item.label,
    icon: item.icon,
    active: location.pathname === item.to || location.pathname.startsWith(item.to + '/'),
    onClick: () => navigate(item.to)
  }));

  const logo = { icon: <i className="fas fa-graduation-cap" />, text: 'LMS Portal' };

  const footerUser = {
    name: user?.username || 'Admin',
    email: user?.email || '',
    initials: 'AD',
    role: 'admin'
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* UPDATED: Added open/onClose props for mobile drawer behavior */}
      <AdminSidebar
        logo={logo}
        navItems={navItems}
        footerUser={footerUser}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.mainArea}>
        <div className={styles.fixedHeader}>
          {/* UPDATED: Added onToggleSidebar prop for hamburger menu */}
          <Header title={pageTitle} onToggleSidebar={toggleSidebar} />

          {/* Dynamic Portal for Buttons (Dashboard injects here) */}
          <div className={styles.headerControlsPortal}>
            {headerComponent}
          </div>
        </div>

        <div className={styles.contentScroll}>
          {/* UPDATED: Ensures content fills 100% width/height */}
          <div className={styles.pageInnerFull}>
            <Outlet context={{ setPageTitle, setHeaderComponent }} />
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '16px',
            width: '90%', maxWidth: '380px', textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px', color: '#1e293b' }}>Confirm Logout</h3>
            <p style={{ color: '#64748b', margin: '0 0 25px' }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;