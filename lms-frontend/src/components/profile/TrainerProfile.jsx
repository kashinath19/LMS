import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './TrainerProfile.module.css';
import { API_BASE_URL } from '../../utils/constants';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

/**
 * TrainerProfile - Trainer profile management component
 * Uses the following API endpoints:
 * - GET /api/v1/profiles/trainer - Get trainer profile
 * - POST /api/v1/profiles/trainer - Create trainer profile
 * - PATCH /api/v1/profiles/trainer - Update trainer profile
 * - POST /api/v1/profiles/upload-image - Upload profile image
 */
const TrainerProfile = ({ showMessage, onProfileCreated, profileExists, setProfileExists }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    experience_years: 0,
    qualification: '',
    bio: '',
    profile_image_url: ''
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

  // GET /api/v1/profiles/trainer - Fetch trainer profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/profiles/trainer`, {
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
      setSkills(data.skills || []);

      const imageUrl = extractImageUrl(data);

      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        experience_years: data.experience_years || 0,
        qualification: data.qualification || '',
        bio: data.bio || '',
        profile_image_url: imageUrl || ''
      });

      showMessage?.('success', 'Trainer profile loaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        // Profile doesn't exist - show create form
        setProfileExists(false);
        setIsCreatingNew(true);
        setIsEditing(true);
        showMessage?.('info', 'Please create your trainer profile');
      } else if (error.response?.status === 401) {
        showMessage?.('error', 'Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        console.error('Error fetching trainer profile:', error);
        showMessage?.('error', 'Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value
    }));
  };

  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills(prev => [...prev, trimmedSkill]);
      setSkillInput('');
    }
  };

  const removeSkill = (index) => setSkills(prev => prev.filter((_, i) => i !== index));

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  // POST /api/v1/profiles/trainer - Create profile
  // PATCH /api/v1/profiles/trainer - Update profile
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
        experience_years: parseInt(formData.experience_years) || 0,
        qualification: formData.qualification,
        bio: formData.bio?.trim() || null,
        profile_image_url: formData.profile_image_url || null,
        skills: skills
      };

      const response = await axios({
        method,
        url: `${API_BASE_URL}/profiles/trainer`,
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
      setSkills(updatedData.skills || []);

      setFormData({
        first_name: updatedData.first_name || '',
        last_name: updatedData.last_name || '',
        phone_number: updatedData.phone_number || '',
        experience_years: updatedData.experience_years || 0,
        qualification: updatedData.qualification || '',
        bio: updatedData.bio || '',
        profile_image_url: imageUrl || ''
      });

      if (onProfileCreated) {
        onProfileCreated();
      }

      displayToast(profileExists ? 'Profile updated successfully' : 'Profile created successfully');
      showMessage?.('success', 'Trainer profile saved successfully!');

    } catch (error) {
      console.error('Error saving trainer profile:', error);
      let errorMessage = 'Failed to save profile';

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Bad request. Please check your input data.';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 409) {
          errorMessage = 'Profile already exists.';
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profileData) {
      const imageUrl = extractImageUrl(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        experience_years: profileData.experience_years || 0,
        qualification: profileData.qualification || '',
        bio: profileData.bio || '',
        profile_image_url: imageUrl || ''
      });
      setSkills(profileData.skills || []);
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

  // POST /api/v1/profiles/upload-image - Upload profile image
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

      // The API returns the image URL as a string
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

        if (onProfileCreated) onProfileCreated();
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

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getFallbackAvatar = () => {
    const seed = (formData.first_name || formData.last_name || user?.email || 'Trainer').split('@')[0];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const profileImageUrl = formData.profile_image_url || profileData?.profile_image_url || '';
  const userEmail = profileData?.email || user?.email || localStorage.getItem('user_email') || '';

  if (loading) {
    return <div className={styles.loading}>Loading trainer profile...</div>;
  }

  return (
    <div className={styles.trainerProfileWrapper}>
      {/* Toast Notification */}
      <div className={styles.topNav}>
        {showToast && (
          <div className={styles.toast} role="status" aria-live="polite">
            <i className="fa-solid fa-check" />
            {toastMessage}
          </div>
        )}
      </div>

      {/* Main Profile Card */}
      <div className={styles.profileCard}>

        {/* Left Column */}
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

          <h2>{formData.first_name && formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'Trainer'}</h2>
          <p className={styles.email}>{userEmail}</p>
          <p className={styles.phone}>{formData.phone_number || 'Not provided'}</p>

          <div className={styles.trainerBadge}>
            {formData.experience_years ? `${formData.experience_years} Years Experience` : 'Trainer'}
          </div>

          {/* Upload Button in Edit Mode */}
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

        {/* Right Column */}
        <div className={styles.rightColumn}>

          {/* Display Mode */}
          {!isEditing && profileExists && (
            <>
              <div className={styles.headerRow}>
                <h1>Profile Details</h1>
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
                  <label>Experience</label>
                  <p>{formData.experience_years ? `${formData.experience_years} years` : 'Not specified'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Phone</label>
                  <p>{formData.phone_number || 'Not specified'}</p>
                </div>
              </div>

              {formData.bio && (
                <div className={styles.bioSection}>
                  <label>Bio</label>
                  <p>{formData.bio}</p>
                </div>
              )}

              {skills.length > 0 && (
                <>
                  <h3 className={styles.sectionTitle}>Skills</h3>
                  <div className={styles.divider} />
                  <div className={styles.skillsDisplay}>
                    {skills.map((skill, idx) => (
                      <span key={idx} className={styles.skillTag}>{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Edit Form Mode */}
          {(isEditing || isCreatingNew) && (
            <form onSubmit={handleSubmit} className={styles.editForm}>
              <div className={styles.headerRow}>
                <h1>{profileExists ? 'Edit Profile' : 'Create Profile'}</h1>
              </div>

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
                  <label htmlFor="experience">Experience (Years)</label>
                  <input
                    type="number"
                    id="experience"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    min="0"
                    max="70"
                    disabled={loading}
                  />
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
                    placeholder="e.g., PhD, M.Tech, B.Sc"
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

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Skills</label>
                  <div className={styles.skillsContainer}>
                    {skills.map((skill, idx) => (
                      <span key={idx} className={styles.skillTagEditable}>
                        {skill}
                        <button type="button" onClick={() => removeSkill(idx)} className={styles.removeSkill}>×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add skill and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyPress}
                      className={styles.skillInput}
                    />
                  </div>
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

export default TrainerProfile;
