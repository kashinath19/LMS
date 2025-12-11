import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import styles from './Layout.module.css';

/**
 * AdminLayout - Layout wrapper for admin pages
 * Includes AdminSidebar + Header + content area with <Outlet/>
 */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // CHANGED: State for controlling the logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Build navigation items with active state based on current path
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

  // Get display info for the footer user
  const getUserInfo = () => {
    if (!user) return { name: 'Admin', email: '', initials: 'AD' };
    const name = user.username || user.name || (user.email ? user.email.split('@')[0] : null) || 'Admin';
    const email = user.email || '';
    const initials = (name || email.split('@')[0] || 'A').toString().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    return { name, email, initials };
  };

  const { name, email, initials } = getUserInfo();

  const footerUser = {
    name,
    email,
    initials,
    role: 'admin'
  };

  // CHANGED: Instead of window.confirm, we open the modal
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // CHANGED: New function to perform the actual logout
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  // Dispatch custom event to trigger modals in AdminDashboard
  const triggerModal = (modalType) => {
    window.dispatchEvent(new CustomEvent('admin-open-modal', { detail: { type: modalType } }));
  };

  // Header actions - only show on dashboard route
  const isDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';
  const headerActions = isDashboard ? [
    {
      label: 'Create Trainer',
      icon: <i className="fas fa-chalkboard-teacher" />,
      onClick: () => triggerModal('trainer'),
      variant: 'primary'
    },
    {
      label: 'Create Student',
      icon: <i className="fas fa-user-graduate" />,
      onClick: () => triggerModal('student'),
      variant: 'primary'
    },
    {
      label: 'Create Admin',
      icon: <i className="fas fa-user-shield" />,
      onClick: () => triggerModal('admin'),
      variant: 'primary'
    }
  ] : [];

  return (
    <div className={styles.pageShell}>
      <AdminSidebar
        logo={logo}
        navItems={navItems}
        footerUser={footerUser}
        onLogout={handleLogout}
      />
      <div className={styles.mainColumn}>
        <Header title="" actions={headerActions} />
        <main className={styles.contentArea}>
          <div className={styles.pageInner}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* CHANGED: Custom Logout Modal */}
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
            <div style={{
              width: '50px', height: '50px', backgroundColor: '#fee2e2', color: '#ef4444',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 15px', fontSize: '20px'
            }}>
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <h3 style={{ margin: '0 0 10px', color: '#1e293b', fontSize: '20px', fontWeight: '700' }}>Confirm Logout</h3>
            <p style={{ color: '#64748b', margin: '0 0 25px', fontSize: '15px' }}>
              Are you sure you want to log out?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;