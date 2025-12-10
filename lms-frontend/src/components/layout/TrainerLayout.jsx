import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TrainerSidebar from './TrainerSidebar';
import Header from './Header';
import styles from './Layout.module.css';
import { API_BASE_URL } from '../../utils/constants';

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

    // Build navigation items - Dashboard, My Courses (no My Profile)
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

    const handleLogout = () => {
        const confirmLogout = window.confirm('Are you sure you want to log out?');
        if (confirmLogout) {
            logout();
            navigate('/login');
        }
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
                    title=""
                    profile={headerProfile}
                />
                <main className={styles.contentArea}>
                    <div className={styles.pageInner}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TrainerLayout;
