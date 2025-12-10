import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';

const Header = ({ title, actions = [], profile, backButton, onToggleSidebar }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // reset error state when profile changes
    setImgError(false);
  }, [profile?.avatarUrl, profile?.email, profile?.name]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Mobile sidebar toggle (render only if handler provided) */}
        {typeof onToggleSidebar === 'function' && (
          <button
            type="button"
            aria-label="Toggle menu"
            className={styles.mobileToggle}
            onClick={onToggleSidebar}
          >
            ☰
          </button>
        )}

        {backButton && (
          <button
            type="button"
            className={styles.backButton}
            onClick={backButton.onClick}
          >
            {backButton.label || 'Back'}
          </button>
        )}

        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {actions?.length > 0 && (
          <div className={styles.actions} role="toolbar" aria-label="Header actions">
            {actions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.actionButton} ${styles[action.variant || 'primary']}`}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-disabled={action.disabled}
              >
                {action.icon && <span className={styles.icon}>{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {profile && (
          <button
            type="button"
            className={styles.profile}
            onClick={profile.onClick}
            aria-label={profile.name ? `Open profile for ${profile.name}` : 'Open profile'}
          >
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{profile.name || profile.email || 'User'}</p>
              {profile.role && <p className={styles.profileRole}>{profile.role}</p>}
            </div>
            <div className={styles.profileAvatar}>
              {profile.avatarUrl && !imgError ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name || profile.email || 'Profile'}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={styles.initials}>
                  {(profile.name || profile.email || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
