import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from './StudentSidebar';
import Header from './Header';
import styles from './Layout.module.css';
import { API_BASE_URL } from '../../utils/constants';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

/**
 * StudentLayout - Layout wrapper for student pages
 * Includes StudentSidebar + Header + content area with <Outlet/>
 */
const StudentLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [studentProfile, setStudentProfile] = useState(null);

    const resolveUrl = (url) => {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        if (url.startsWith('//')) return window.location.protocol + url;
        if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
        return `${API_ORIGIN}/${url}`;
    };

    // Fetch student profile for header avatar
    const fetchStudentProfile = useCallback(async () => {
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
                const firstName = data?.first_name || '';
                const lastName = data?.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const email = data?.email || user?.email || localStorage.getItem('user_email') || '';

                // Extract profile image URL - try multiple possible fields
                let imageUrl = data?.profile_image_url || data?.profile_image || data?.image_url || null;
                if (imageUrl) {
                    imageUrl = resolveUrl(imageUrl);
                }

                setStudentProfile({
                    name: fullName || email.split('@')[0] || 'Student',
                    email: email,
                    avatarUrl: imageUrl
                });
            }
        } catch (error) {
            console.log('StudentLayout: Could not fetch student profile', error);
        }
    }, [user?.email]);

    useEffect(() => {
        fetchStudentProfile();
    }, [fetchStudentProfile]);

    // Build navigation items - removed "My Profile" as per requirements
    const navItems = [
        { label: 'Dashboard', icon: <i className="fas fa-home" />, to: '/student/dashboard' },
        { label: 'My Courses', icon: <i className="fas fa-book" />, to: '/student/courses' },
    ].map(item => ({
        label: item.label,
        icon: item.icon,
        active: location.pathname === item.to || location.pathname.startsWith(item.to + '/'),
        onClick: () => navigate(item.to)
    }));

    const logo = { icon: <i className="fas fa-graduation-cap" />, text: 'Student Portal' };

    // Get display info for the footer user
    const getUserInfo = () => {
        if (studentProfile) {
            return {
                name: studentProfile.name,
                email: studentProfile.email,
                initials: studentProfile.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'ST'
            };
        }
        if (!user) return { name: 'Student', email: '', initials: 'ST' };
        const name = user.username || user.name || (user.email ? user.email.split('@')[0] : null) || 'Student';
        const email = user.email || '';
        const initials = (name || email.split('@')[0] || 'S').toString().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return { name, email, initials };
    };

    const { name, email, initials } = getUserInfo();

    const footerUser = {
        name,
        email,
        initials,
        avatarUrl: studentProfile?.avatarUrl || null,
        role: 'student'
    };

    // Header profile prop for avatar-click navigation
    const headerProfile = {
        name: studentProfile?.name || name,
        email: studentProfile?.email || email,
        avatarUrl: studentProfile?.avatarUrl || null,
        role: 'Student',
        onClick: () => navigate('/student/profile')
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
            <StudentSidebar
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

export default StudentLayout;
