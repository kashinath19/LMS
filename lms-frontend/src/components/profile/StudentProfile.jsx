import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './StudentProfile.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';
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
      obj.profile_image?.url,
      obj.profile_image?.file_url,
      obj.profile_image?.path,
      obj.profile_image?.file,
      obj.data?.profile_image_url,
      obj.data?.url,
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

      console.log('Fetching student profile...');

      const response = await axios.get(`${API_BASE_URL}/profiles/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data;
      console.log('Student profile fetched:', data);
      
      setProfileData(data);
      setProfileExists(true);
      setIsEditing(false);

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

      showMessage('success', 'Student profile loaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No student profile found - showing create form');
        setProfileExists(false);
        setIsCreatingNew(true);
        setIsEditing(true);
        showMessage('info', 'Please create your student profile');
      } else if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 1500);
      } else {
        console.error('Error fetching student profile:', error);
        showMessage('error', 'Failed to load profile. Please try again.');
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
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const endpoint = `${API_BASE_URL}/profiles/student`;
      const method = profileExists ? 'PATCH' : 'POST';

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
        url: endpoint,
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

      if (onProfileCreated) {
        onProfileCreated();
      }

      displayToast('Changes saved successfully');
      showMessage('success', 'Student profile saved successfully!');

      // Redirect to student dashboard after a short delay
      setTimeout(() => {
        navigate('/student-dashboard', { replace: true });
      }, 300);

    } catch (error) {
      console.error('Error saving student profile:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to save profile';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Bad request. Please check your input data.';
          if (error.response.data?.detail) {
            errorMessage += ` Details: ${JSON.stringify(error.response.data.detail)}`;
          }
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 422) {
          errorMessage = 'Validation error. Please check all fields.';
          if (error.response.data?.detail) {
            errorMessage += ` Details: ${JSON.stringify(error.response.data.detail)}`;
          }
        }
      }
      
      showMessage('error', errorMessage);
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
    showMessage('info', 'Edit cancelled');
  };

  const resetForm = () => {
    if (profileData && isEditing) {
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
    } else {
      setFormData({
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
    }
    showMessage('info', 'Form reset');
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

      const resp = await axios.post(`${API_BASE_URL}/profiles/upload-image`, form, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = extractImageUrl(resp.data);
      if (!imageUrl) {
        showMessage('error', 'Upload succeeded but no image URL returned.');
        console.warn('Upload response:', resp.data);
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
        displayToast('Changes saved successfully');
        showMessage('success', 'Profile photo uploaded');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
      } else {
        showMessage('error', error.response?.data?.detail || 'Failed to upload image');
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

  const profileImageUrl = formData.profile_image_url || profileData?.profile_image_url || '';
  const userEmail = user?.email || '';

  if (loading) {
    return <div className="loading">Loading student profile...</div>;
  }

  return (
    <div className="student-profile-wrapper">
      {/* Top Navigation */}
      <div className="top-nav">
        {showToast && (
          <div className="toast">
            <i className="fa-solid fa-check"></i>
            {toastMessage}
          </div>
        )}
      </div>

      {/* Main Profile Card */}
      <div className="profile-card">
        
        {/* Left Column */}
        <div className="left-column">
          <div className="avatar-container">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile Avatar" />
            ) : (
              <div className="avatar-placeholder">
                <span className="initials">
                  {(formData.first_name?.[0] || '') + (formData.last_name?.[0] || '')}
                </span>
              </div>
            )}
          </div>
          
          <h2>{formData.first_name && formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'Student'}</h2>
          <p className="email">{userEmail}</p>
          <p className="phone">{formData.phone_number || 'Not provided'}</p>
          
          <div style={{ marginBottom: '20px' }}></div>
          <div className="student-id-badge">
            {formData.enrollment_number || 'NO ENROLLMENT'}
          </div>

          {/* Upload Button in Edit Mode */}
          {isEditing && (
            <div style={{ marginTop: '20px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileSelected}
              />
              <button
                type="button"
                className="btn-upload"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="right-column">
          
          {/* Display Mode */}
          {!isEditing && profileExists && (
            <>
              <div className="header-row">
                <h1>Profile Details</h1>
                <button className="btn-edit" onClick={handleEdit}>
                  <i className="fa-solid fa-pen"></i> Edit Profile
                </button>
              </div>

              <h3 className="section-title">Personal Information</h3>
              <div className="divider"></div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Qualification</label>
                  <p>{formData.qualification || 'Not specified'}</p>
                </div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <p>{formatDate(formData.date_of_birth)}</p>
                </div>
                <div className="info-item">
                  <label>Gender</label>
                  <p>{formData.gender || 'Not specified'}</p>
                </div>
              </div>

              {formData.bio && (
                <div className="bio-section">
                  <label>Bio</label>
                  <p>{formData.bio}</p>
                </div>
              )}

              {(formData.github_url || formData.linkedin_url) && (
                <>
                  <h3 className="section-title">Social Links</h3>
                  <div className="divider"></div>
                  <div className="social-icons">
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

          {/* Edit Form Mode */}
          {(isEditing || isCreatingNew) && (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="header-row">
                <h1>{profileExists ? 'Edit Profile' : 'Create Profile'}</h1>
              </div>

              <h3 className="section-title">Personal Information</h3>
              <div className="divider"></div>

              <div className="fields-grid">
                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
                  <label htmlFor="enrollment">Enrollment Number</label>
                  <input
                    type="text"
                    id="enrollment"
                    name="enrollment_number"
                    value={formData.enrollment_number}
                    onChange={handleChange}
                    placeholder="University enrollment number"
                    disabled={loading}
                  />
                </div>
              </div>

              <h3 className="section-title">Social Links</h3>
              <div className="divider"></div>

              <div className="fields-grid">
                <div className="form-group">
                  <label htmlFor="github">GitHub URL</label>
                  <input
                    type="url"
                    id="github"
                    name="github_url"
                    value={formData.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="linkedin">LinkedIn URL</label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    disabled={loading}
                  />
                </div>
              </div>

              <h3 className="section-title">Bio</h3>
              <div className="divider"></div>

              <div className="form-group full-width">
                <label htmlFor="bio">Bio / About Me</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about your educational background, interests, and goals..."
                  rows="4"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                {isEditing && profileExists && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={resetForm}
                  disabled={loading}
                >
                  {profileExists ? 'Reset' : 'Clear'}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                >
                  {loading 
                    ? 'Saving...' 
                    : profileExists 
                      ? 'Save Changes' 
                      : 'Create Profile'
                  }
                </button>
              </div>
            </form>
          )}

          {/* Create Profile Prompt */}
          {isCreatingNew && !profileExists && (
            <div className="create-prompt">
              <i className="fas fa-info-circle"></i>
              <p>Welcome! This is your first time here. Please create your student profile to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;