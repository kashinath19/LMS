import React, { useState, useEffect, useCallback } from 'react';
import { Box } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './StudentDashboard.module.css';
import { API_BASE_URL } from '../../utils/constants';

/**
 * StudentDashboard - Main dashboard page for students
 * Layout is provided by StudentLayout via routing - this component renders content only
 * Profile navigation is handled by the header avatar, not dashboard content
 */
const StudentDashboard = () => {
  const [profileData, setProfileData] = useState(null);
  const { user } = useAuth();

  // Fetch Student Profile Data for display name
  const fetchProfile = useCallback(async () => {
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
        setProfileData(data);
      } else if (response.status === 404) {
        setProfileData(null);
      }
    } catch (error) {
      console.log("Profile not created yet or error loading:", error);
      setProfileData(null);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Helper for name display
  const getDisplayName = () => {
    if (profileData && profileData.first_name) {
      return `${profileData.first_name} ${profileData.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Student';
  };

  return (
    <div className={styles.studentDashboardContent}>
      <div className={styles.dashboardHeader}>
        <h1>Welcome, {getDisplayName()}!</h1>
      </div>
      <div className={styles.emptyState}>
        <Box size={48} className={styles.emptyIcon} />
        <span className={styles.emptyText}>Your dashboard is empty</span>
        <p className={styles.emptyDescription}>Start exploring courses and track your progress here.</p>
      </div>
    </div>
  );
};

export default StudentDashboard;
