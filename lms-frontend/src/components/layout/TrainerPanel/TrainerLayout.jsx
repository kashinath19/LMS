import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import TrainerSidebar from './TrainerSidebar';
import Header from '../Header';
import styles from '../Layout.module.css';
import { API_BASE_URL } from '../../../utils/constants';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

/**
 * TrainerLayout - Layout wrapper for trainer pages
 * Includes TrainerSidebar + Header + content area with <Outlet/>
 */
const TrainerLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [trainerProfile, setTrainerProfile] = useState(null);
    
    // CHANGED: State for logout modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [pageTitle, setPageTitle] = useState('');

    const resolveUrl = (url) => {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        if (url.startsWith('//')) return window.location.protocol + url;
        if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
        return `${API_ORIGIN}/${url}`;
    };

    // Fetch trainer profile for header avatar
    const fetchTrainerProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/profiles/trainer`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const firstName = data?.first_name || '';
                const lastName = data?.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const email = data?.email || user?.email || localStorage.getItem('user_email') || '';

                // Extract profile image URL
                let imageUrl = data?.profile_image_url || data?.profile_image || data?.image_url || null;
                if (imageUrl) {
                    imageUrl = resolveUrl(imageUrl);
                }

                setTrainerProfile({
                    name: fullName || email.split('@')[0] || 'Trainer',
                    email: email,
                    avatarUrl: imageUrl
                });
            }
        } catch (error) {
            console.log('TrainerLayout: Could not fetch trainer profile', error);
        }
    }, [user?.email]);

    useEffect(() => {
        fetchTrainerProfile();
    }, [fetchTrainerProfile]);

    // Build navigation items
    const navItems = [
        { label: 'Dashboard', icon: <i className="fas fa-home" />, to: '/trainer/dashboard' },
        { label: 'My Courses', icon: <i className="fas fa-book" />, to: '/trainer/courses' },
    ].map(item => ({
        label: item.label,
        icon: item.icon,
        active: location.pathname === item.to || location.pathname.startsWith(item.to + '/'),
        onClick: () => navigate(item.to)
    }));

    const logo = { icon: <i className="fas fa-chalkboard-teacher" />, text: 'Trainer Portal' };

    // Get display info for the footer user
    const getUserInfo = () => {
        if (trainerProfile) {
            return {
                name: trainerProfile.name,
                email: trainerProfile.email,
                initials: trainerProfile.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'TR'
            };
        }
        if (!user) return { name: 'Trainer', email: '', initials: 'TR' };
        const name = user.username || user.name || (user.email ? user.email.split('@')[0] : null) || 'Trainer';
        const email = user.email || '';
        const initials = (name || email.split('@')[0] || 'T').toString().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return { name, email, initials };
    };

    const { name, email, initials } = getUserInfo();

    const footerUser = {
        name,
        email,
        initials,
        avatarUrl: trainerProfile?.avatarUrl || null,
        role: 'trainer'
    };

    // Header profile prop for avatar-click navigation
    const headerProfile = {
        name: trainerProfile?.name || name,
        email: trainerProfile?.email || email,
        avatarUrl: trainerProfile?.avatarUrl || null,
        role: 'Trainer',
        onClick: () => navigate('/trainer/profile')
    };

    // CHANGED: Trigger modal instead of window.confirm
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    // CHANGED: Function to execute logout
    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.pageShell}>
            <TrainerSidebar
                logo={logo}
                navItems={navItems}
                footerUser={footerUser}
                onLogout={handleLogout}
            />
            <div className={styles.mainColumn}>
                <Header
                    title={pageTitle}
                    profile={headerProfile}
                />
                <main className={styles.contentArea}>
                    <div className={styles.pageInner}>
                        <Outlet context={{ setPageTitle }} />
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

export default TrainerLayout;