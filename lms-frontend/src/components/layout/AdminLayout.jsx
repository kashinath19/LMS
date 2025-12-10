import React from 'react';
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

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      logout();
      navigate('/login');
    }
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
    </div>
  );
};

export default AdminLayout;