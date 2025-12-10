import React from 'react';
import Header from './Header';
import styles from './Layout.module.css';

/**
 * Shared page layout wrapper - Shell only (Header + Content Area).
 * Sidebar is NOT rendered here - use AdminLayout for admin pages,
 * StudentLayout for student pages, TrainerLayout for trainer pages.
 *
 * Props:
 * - title: string shown in the header
 * - actions: [{ label, icon, onClick, variant, disabled }]
 * - profile: { name, role, avatarUrl, onClick }
 * - backButton: { label, onClick }
 * - onToggleSidebar: optional callback for mobile menu toggle
 * - children: page content
 */
const Layout = ({
  title,
  actions = [],
  profile,
  backButton,
  onToggleSidebar,
  children,
}) => {
  return (
    <div className={styles.pageShell}>
      <div className={styles.mainColumn}>
        <Header
          title={title}
          actions={actions}
          profile={profile}
          backButton={backButton}
          onToggleSidebar={onToggleSidebar}
        />

        <main className={styles.contentArea}>
          <div className={styles.pageInner}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
