import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const useProfile = (userRole) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const getEndpoint = useCallback(() => {
    if (!userRole) {
      console.warn('useProfile: no userRole provided — aborting endpoint selection');
      return null;
    }
    if (userRole === 'student') return `${API_BASE_URL}/profiles/student`;
    if (userRole === 'trainer') return `${API_BASE_URL}/profiles/trainer`;
    console.warn('useProfile: unknown userRole:', userRole, 'defaulting to student endpoint');
    return `${API_BASE_URL}/profiles/student`;
  }, [userRole]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const endpoint = getEndpoint();
      if (!endpoint) {
        setError('Missing user role; cannot fetch profile');
        throw new Error('Missing user role; cannot fetch profile');
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProfile(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to load profile';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getEndpoint]);

  const saveProfile = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const endpoint = getEndpoint();
      const method = profile ? 'PATCH' : 'POST';

      const response = await axios({
        method,
        url: endpoint,
        data,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProfile(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to save profile';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile, getEndpoint]);

  const resetProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    saveProfile,
    resetProfile,
    setProfile
  };
};
