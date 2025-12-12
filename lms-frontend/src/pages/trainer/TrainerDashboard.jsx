import React, { useState, useEffect, useCallback } from 'react';
import { Box } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import styles from './TrainerDashboard.module.css';
import { API_BASE_URL } from '../../utils/constants';

const TrainerDashboard = () => {
  const [profileData, setProfileData] = useState(null);
  const { user } = useAuth();
  const { setPageTitle } = useOutletContext();

  // Fetch Profile to get accurate name for the Welcome Message
  const fetchProfile = useCallback(async () => {
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
        setProfileData(data);
      }
    } catch (error) {
      console.log("Error loading profile for dashboard:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update the Header Title with the specific name
  useEffect(() => {
    let displayName = 'Trainer';
    if (profileData && profileData.first_name) {
        displayName = `${profileData.first_name} ${profileData.last_name || ''}`.trim();
    } else if (user?.name) {
        displayName = user.name;
    } else if (user?.username) {
        displayName = user.username;
    }

    setPageTitle(`Welcome, ${displayName}!`);
    return () => setPageTitle('');
  }, [setPageTitle, profileData, user]);

  return (
    <div className={styles.trainerDashboardContent}>
      <div className={styles.emptyState}>
        <Box size={48} className={styles.emptyIcon} />
        <span className={styles.emptyText}>Your dashboard is empty</span>
        <p className={styles.emptyDescription}>Manage your courses and students here.</p>
      </div>
    </div>
  );
};

export default TrainerDashboard;