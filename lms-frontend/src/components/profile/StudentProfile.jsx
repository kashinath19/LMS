import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './StudentProfile.module.css';
import { API_BASE_URL } from '../../utils/constants';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

const StudentProfile = ({ showMessage, onProfileCreated, profileExists, setProfileExists }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    qualification: '',
    bio: '',
    profile_image_url: '',
    enrollment_number: '',
    github_url: '',
    linkedin_url: '',
    gender: ''
  });
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const resolveUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return window.location.protocol + url;
    if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
    return `${API_ORIGIN}/${url}`;
  };

  const extractImageUrl = (obj) => {
    if (!obj) return '';
    const candidates = [
      obj.profile_image_url,
      obj.profile_image,
      obj.image_url,
      obj.avatar_url,
      obj.url,
      obj.file_url,
    ];
    for (const c of candidates) {
      if (c) return resolveUrl(c);
    }
    return '';
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/profiles/student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      setProfileData(data);
      setProfileExists(true);
      setIsEditing(false);
      setIsCreatingNew(false);

      const imageUrl = extractImageUrl(data);

      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        date_of_birth: data.date_of_birth || '',
        qualification: data.qualification || '',
        bio: data.bio || '',
        profile_image_url: imageUrl || '',
        enrollment_number: data.enrollment_number || '',
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        gender: data.gender || ''
      });

      showMessage?.('success', 'Student profile loaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        setProfileExists(false);
        setIsCreatingNew(true);
        setIsEditing(true);
        showMessage?.('info', 'Please create your student profile');
      } else if (error.response?.status === 401) {
        showMessage?.('error', 'Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        console.error('Error fetching student profile:', error);
        showMessage?.('error', 'Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.qualification) {
      showMessage?.('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const method = profileExists ? 'patch' : 'post';

      const dataToSubmit = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number?.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        qualification: formData.qualification,
        bio: formData.bio?.trim() || null,
        profile_image_url: formData.profile_image_url || null,
        enrollment_number: formData.enrollment_number?.trim() || null,
        github_url: formData.github_url?.trim() || null,
        linkedin_url: formData.linkedin_url?.trim() || null,
        gender: formData.gender || null
      };

      const response = await axios({
        method,
        url: `${API_BASE_URL}/profiles/student`,
        data: dataToSubmit,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedData = response.data;
      const imageUrl = extractImageUrl(updatedData);

      setProfileData(updatedData);
      setProfileExists(true);
      setIsCreatingNew(false);
      setIsEditing(false);

      setFormData({
        first_name: updatedData.first_name || '',
        last_name: updatedData.last_name || '',
        phone_number: updatedData.phone_number || '',
        date_of_birth: updatedData.date_of_birth || '',
        qualification: updatedData.qualification || '',
        bio: updatedData.bio || '',
        profile_image_url: imageUrl || '',
        enrollment_number: updatedData.enrollment_number || '',
        github_url: updatedData.github_url || '',
        linkedin_url: updatedData.linkedin_url || '',
        gender: updatedData.gender || ''
      });

      // ⭐ REDIRECT ON FIRST PROFILE CREATION: notify parent to handle redirect
      if (!profileExists) {
        displayToast('Profile created successfully');
        showMessage?.('success', 'Student profile created!');
        if (typeof onProfileCreated === 'function') {
          onProfileCreated();
        } else {
          setTimeout(() => {
            navigate('/student-dashboard', { replace: true });
          }, 800);
        }
        return;
      }

      displayToast('Profile updated successfully');
      showMessage?.('success', 'Student profile saved successfully!');

    } catch (error) {
      console.error('Error saving student profile:', error);
      let errorMessage = 'Failed to save profile';

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Bad request. Please check your input data.';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 409) {
          errorMessage = 'Profile already exists or enrollment number is taken.';
        } else if (error.response.status === 422) {
          errorMessage = 'Validation error. Please check all fields.';
          if (error.response.data?.detail) {
            const details = error.response.data.detail;
            if (Array.isArray(details)) {
              errorMessage += ` ${details.map(d => d.msg).join(', ')}`;
            }
          }
        }
      }

      showMessage?.('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancelEdit = () => {
    if (profileData) {
      const imageUrl = extractImageUrl(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        date_of_birth: profileData.date_of_birth || '',
        qualification: profileData.qualification || '',
        bio: profileData.bio || '',
        profile_image_url: imageUrl || '',
        enrollment_number: profileData.enrollment_number || '',
        github_url: profileData.github_url || '',
        linkedin_url: profileData.linkedin_url || '',
        gender: profileData.gender || ''
      });
    }
    setIsEditing(false);
    showMessage?.('info', 'Edit cancelled');
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    e.target.value = '';
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      const token = localStorage.getItem('access_token');
      const form = new FormData();
      form.append('file', file);

      const resp = await axios.post(`${API_BASE_URL}/profiles/upload-image?update_profile=true`, form, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = typeof resp.data === 'string' ? resolveUrl(resp.data) : extractImageUrl(resp.data);

      if (!imageUrl) {
        showMessage?.('error', 'Upload succeeded but no image URL returned.');
      } else {
        const updatedProfileData = {
          ...(profileData || {}),
          profile_image_url: imageUrl
        };
        setProfileData(updatedProfileData);
        setFormData(prev => ({
          ...prev,
          profile_image_url: imageUrl
        }));
        displayToast('Profile photo uploaded');
        showMessage?.('success', 'Profile photo uploaded');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response?.status === 401) {
        showMessage?.('error', 'Session expired. Please login again.');
      } else {
        showMessage?.('error', error.response?.data?.detail || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getFallbackAvatar = () => {
    const seed = (formData.first_name || formData.last_name || user?.email || 'Student').split('@')[0];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const profileImageUrl = formData.profile_image_url || profileData?.profile_image_url || '';
  const userEmail = profileData?.email || user?.email || localStorage.getItem('user_email') || '';

  if (loading) {
    return <div className={styles.loading}>Loading student profile...</div>;
  }

  return (
    <div className={styles.studentProfileWrapper}>
      <div className={styles.topNav}>
        {showToast && (
          <div className={styles.toast} role="status" aria-live="polite">
            <i className="fa-solid fa-check" />
            {toastMessage}
          </div>
        )}
      </div>

      <div className={styles.profileCard}>
        <div className={styles.leftColumn}>
          <div className={styles.avatarContainer}>
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile Avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackAvatar();
                }}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <span className={styles.initials}>
                  {(formData.first_name?.[0] || '') + (formData.last_name?.[0] || '')}
                </span>
              </div>
            )}
          </div>

          <h2>{formData.first_name && formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'Student'}</h2>
          <p className={styles.email}>{userEmail}</p>
          <p className={styles.phone}>{formData.phone_number || 'Not provided'}</p>

          <div className={styles.studentIdBadge}>
            {formData.enrollment_number || 'NO ENROLLMENT'}
          </div>

          {(isEditing || isCreatingNew) && (
            <div style={{ marginTop: '16px', width: '100%' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileSelected}
                id="profile-image-upload"
                name="profile-image"
              />
              <button
                type="button"
                className={styles.btnUpload}
                onClick={handleUploadClick}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          {!isEditing && profileExists && (
            <>
              <div className={styles.headerRow}>
                <button className={styles.btnEdit} onClick={handleEdit} type="button">
                  <i className="fa-solid fa-pen"></i> Edit Profile
                </button>
              </div>

              <h3 className={styles.sectionTitle}>Personal Information</h3>
              <div className={styles.divider} />

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Qualification</label>
                  <p>{formData.qualification || 'Not specified'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Date of Birth</label>
                  <p>{formatDate(formData.date_of_birth)}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Gender</label>
                  <p>{formData.gender || 'Not specified'}</p>
                </div>
              </div>

              {formData.bio && (
                <div className={styles.bioSection}>
                  <label>Bio</label>
                  <p>{formData.bio}</p>
                </div>
              )}

              {(formData.github_url || formData.linkedin_url) && (
                <>
                  <h3 className={styles.sectionTitle}>Social Links</h3>
                  <div className={styles.divider} />
                  <div className={styles.socialIcons}>
                    {formData.github_url && (
                      <a href={formData.github_url} target="_blank" rel="noopener noreferrer" title="GitHub">
                        <i className="fa-brands fa-github"></i>
                      </a>
                    )}
                    {formData.linkedin_url && (
                      <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                        <i className="fa-brands fa-linkedin"></i>
                      </a>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {(isEditing || isCreatingNew) && (
            <form onSubmit={handleSubmit} className={styles.editForm}>
              <div className={styles.headerRow} />

              <h3 className={styles.sectionTitle}>Personal Information</h3>
              <div className={styles.divider} />

              <div className={styles.fieldsGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dob">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="qualification">Qualification *</label>
                  <input
                    type="text"
                    id="qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    required
                    placeholder="e.g., B.Tech, B.Sc, M.Sc"
                    disabled={loading}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="enrollment">Enrollment Number</label>
                  <input
                    type="text"
                    id="enrollment"
                    name="enrollment_number"
                    value={formData.enrollment_number}
                    onChange={handleChange}
                    placeholder="Your enrollment number"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="github">GitHub URL</label>
                  <input
                    type="url"
                    id="github"
                    name="github_url"
                    value={formData.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="linkedin">LinkedIn URL</label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                {profileExists && (
                  <button type="button" className={styles.btnSecondary} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? 'Saving...' : (profileExists ? 'Save Changes' : 'Create Profile')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
