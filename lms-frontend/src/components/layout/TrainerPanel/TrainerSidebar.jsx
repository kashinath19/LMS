import React, { useEffect, useState, useCallback } from 'react';
import styles from './TrainerSidebar.module.css';
import { API_BASE_URL } from '../../../utils/constants';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

/**
 * TrainerSidebar component - Trainer navigation sidebar with AdminSidebar UI
 * Props:
 *  - logo: { icon, text }
 *  - navItems: [{ label, icon, active, onClick, disabled }]
 *  - footerUser: { name, email, initials, avatarUrl }
 *  - onLogout: fn
 *  - open: bool (optional) - controls mobile drawer open state
 *  - onClose: fn (optional) - called when the overlay is clicked
 */
const TrainerSidebar = ({ logo, navItems = [], footerUser: footerUserProp, onLogout, open = false, onClose }) => {
    const [trainerProfile, setTrainerProfile] = useState(null);

    const resolveUrl = (url) => {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        if (url.startsWith('//')) return window.location.protocol + url;
        if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
        return `${API_ORIGIN}/${url}`;
    };

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
                const email = data?.email || localStorage.getItem('user_email') || '';

                setTrainerProfile({
                    name: fullName || email.split('@')[0] || 'Trainer',
                    email: email,
                    avatarUrl: data?.profile_image_url ? resolveUrl(data.profile_image_url) : null
                });
            }
        } catch (error) {
            console.log('TrainerSidebar: Could not fetch trainer profile', error);
        }
    }, []);

    useEffect(() => {
        fetchTrainerProfile();
    }, [fetchTrainerProfile]);

    // Merge fetched trainer profile with prop data
    const footerUser = (() => {
        const nameFromStorage = localStorage.getItem('user_name');
        const emailFromStorage = localStorage.getItem('user_email');

        const name = trainerProfile?.name || footerUserProp?.name || nameFromStorage || (emailFromStorage ? emailFromStorage.split('@')[0] : null) || 'Trainer';
        const email = trainerProfile?.email || footerUserProp?.email || emailFromStorage || null;

        return {
            role: 'trainer',
            name,
            email,
            avatarUrl: trainerProfile?.avatarUrl || footerUserProp?.avatarUrl || null,
            initials: footerUserProp?.initials || (name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'TR')
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

                    <nav className={styles.nav} aria-label="Trainer navigation">
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

export default TrainerSidebar;