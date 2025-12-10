import React, { useEffect, useState } from 'react';
import styles from './AdminSidebar.module.css';
import api from '../../services/api';

/**
 * AdminSidebar component - Admin-specific navigation sidebar
 * Props:
 *  - logo: { icon, text }
 *  - navItems: [{ label, icon, active, onClick, disabled }]
 *  - footerUser: { name, email, initials, avatarUrl }
 *  - onLogout: fn
 *  - open: bool (optional) - controls mobile drawer open state
 *  - onClose: fn (optional) - called when the overlay is clicked
 */
const AdminSidebar = ({ logo, navItems = [], footerUser: footerUserProp, onLogout, open = false, onClose }) => {
    const [adminProfile, setAdminProfile] = useState(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            const userId = localStorage.getItem('user_id');
            const cacheKey = userId ? `admin_profile_${userId}` : 'admin_profile';

            // Try cache first
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && (parsed.username || parsed.name) && parsed.email) {
                        setAdminProfile(parsed);
                        return;
                    }
                }
            } catch (e) {
                // ignore parse errors
            }

            if (!userId) {
                const fallbackEmail = localStorage.getItem('user_email');
                const fallbackName = localStorage.getItem('user_name') || (fallbackEmail ? fallbackEmail.split('@')[0] : null);
                setAdminProfile({ id: null, name: fallbackName, username: null, email: fallbackEmail });
                return;
            }

            try {
                const res = await api.get(`/users/${encodeURIComponent(userId)}`);
                const data = res?.data ?? res;
                const username = data?.username || data?.user_name || data?.name || null;
                const email = data?.email || data?.email_address || null;
                const displayName = username || (email ? email.split('@')[0] : null);

                const normalized = {
                    id: data?.id || null,
                    name: displayName,
                    username,
                    email,
                    avatarUrl: data?.avatarUrl || null
                };

                setAdminProfile(normalized);

                try {
                    localStorage.setItem(cacheKey, JSON.stringify(normalized));
                } catch (err) {
                    // ignore storage errors
                }
            } catch (err) {
                console.warn('AdminSidebar: could not fetch admin profile', err);
                const fallbackEmail = localStorage.getItem('user_email');
                const fallbackName = localStorage.getItem('user_name') || (fallbackEmail ? fallbackEmail.split('@')[0] : null);
                setAdminProfile({ id: userId, name: fallbackName, username: null, email: fallbackEmail });
            }
        };

        fetchAdminData();
    }, []);

    // Merge fetched admin profile with prop data
    const footerUser = (() => {
        const nameFromStorage = localStorage.getItem('user_name');
        const emailFromStorage = localStorage.getItem('user_email');

        const name = adminProfile?.name || footerUserProp?.name || nameFromStorage || (emailFromStorage ? emailFromStorage.split('@')[0] : null);
        const email = adminProfile?.email || footerUserProp?.email || emailFromStorage || null;

        return {
            role: 'admin',
            name,
            email,
            avatarUrl: adminProfile?.avatarUrl || footerUserProp?.avatarUrl || null,
            initials: footerUserProp?.initials || (name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'AD')
        };
    })();

    const handleOverlayClick = () => {
        if (typeof onClose === 'function') onClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {open && <div className={styles.sidebarOverlay} onClick={handleOverlayClick} aria-hidden="true" />}

            <aside
                className={`${styles.sidebar} ${open ? styles.open : ''}`}
                aria-hidden={!open && typeof window !== 'undefined' && window.innerWidth <= 768}
            >
                <div className={styles.top}>
                    {logo && (
                        <div className={styles.logo}>
                            {logo.icon && <span className={styles.logoIcon}>{logo.icon}</span>}
                            {logo.text && <span className={styles.logoText}>{logo.text}</span>}
                        </div>
                    )}

                    <nav className={styles.nav} aria-label="Admin navigation">
                        {navItems.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                                onClick={item.onClick}
                                disabled={item.disabled}
                                aria-current={item.active ? 'page' : undefined}
                            >
                                {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                                <span className={styles.navLabel}>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className={styles.footer}>
                    {footerUser && (
                        <div className={styles.userBlock}>
                            <div className={styles.avatar}>
                                {footerUser.avatarUrl ? (
                                    <img
                                        src={footerUser.avatarUrl}
                                        alt={footerUser.name || 'User'}
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                ) : (
                                    <span>{footerUser.initials}</span>
                                )}
                            </div>

                            <div className={styles.userMeta}>
                                <div className={styles.userName}>{footerUser.name}</div>
                                {footerUser.email && <div className={styles.userEmail}>{footerUser.email}</div>}
                            </div>
                        </div>
                    )}

                    {onLogout && (
                        <button type="button" className={styles.logout} onClick={onLogout}>
                            <span className={styles.logoutIcon}>⏻</span>
                            <span>Logout</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
