import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

const StudentProfile = ({ showMessage, onProfileCreated, profileExists, setProfileExists }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
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

  const getAvatarInitials = () => {
    const firstInitial = formData.first_name?.[0] || '';
    const lastInitial = formData.last_name?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'S';
  };

  const profileImageUrl = formData.profile_image_url || profileData?.profile_image_url || '';

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

  if (loading) return <div className="loading">Loading student profile...</div>;

  return (
    <div className="profile-card">
      <div className="card-header">
        <div className="avatar-container">
          <div
            className="avatar-circle"
            id="avatarCircle"
            style={
              profileImageUrl
                ? { backgroundImage: `url("${profileImageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          >
            {!profileImageUrl && getAvatarInitials()}
          </div>

          {/* File input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileSelected}
          />

          {/* Upload button - only shown in edit mode */}
          {(isCreatingNew || isEditing) && (
            <button
              type="button"
              className="upload-btn"
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
        </div>

        <div className="user-summary">
          <h2 id="userName">
            {profileExists ? `${formData.first_name} ${formData.last_name}`.trim() || 'Student' : 'Create Your Profile'}
          </h2>
          <span id="userInfo">
            {profileExists
              ? (formData.qualification 
                  ? `${formData.qualification}` 
                  : 'Student')
              : 'Complete the form below to get started'
            }
          </span>
        </div>
        
        {profileExists && !isEditing && (
          <button 
            type="button" 
            className="edit-button-top-right"
            onClick={handleEdit}
          >
            <i className="fas fa-edit"></i> Edit
          </button>
        )}
      </div>

      <div className="form-container">
        {isCreatingNew && !profileExists && (
          <div className="message info" style={{ marginBottom: '1.5rem' }}>
            <i className="fas fa-info-circle"></i>
            Welcome! This is your first time here. Please create your student profile.
          </div>
        )}

        {/* NEW PROFILE DISPLAY LAYOUT - Matching the image */}
        {profileExists && !isEditing && (
          <div className="profile-display-layout">
            {/* Personal Information Section */}
            <div className="profile-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="info-grid">
                <div className="info-row">
                  <div className="info-label">Qualification</div>
                  <div className="info-value">{formData.qualification || 'Not specified'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Date of Birth</div>
                  <div className="info-value">{formatDate(formData.date_of_birth)}</div>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-label">Gender</div>
                <div className="info-value">{formData.gender || 'Not specified'}</div>
              </div>
            </div>

            {/* Bio Section */}
            {formData.bio && (
              <div className="profile-section">
                <h3 className="section-title">Bio</h3>
                <div className="bio-content">
                  {formData.bio}
                </div>
              </div>
            )}

            {/* Social Links Section */}
            {(formData.github_url || formData.linkedin_url) && (
              <div className="profile-section">
                <h3 className="section-title">Social Links</h3>
                <div className="social-links">
                  {formData.github_url && (
                    <a 
                      href={formData.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      <i className="fab fa-github"></i> GitHub
                    </a>
                  )}
                  {formData.linkedin_url && (
                    <a 
                      href={formData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      <i className="fab fa-linkedin"></i> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information (Optional - shown in edit mode) */}
            {(formData.phone_number || formData.enrollment_number) && (
              <div className="profile-section">
                <h3 className="section-title">Additional Information</h3>
                <div className="info-grid">
                  {formData.phone_number && (
                    <div className="info-row">
                      <div className="info-label">Phone Number</div>
                      <div className="info-value">{formData.phone_number}</div>
                    </div>
                  )}
                  {formData.enrollment_number && (
                    <div className="info-row">
                      <div className="info-label">Enrollment Number</div>
                      <div className="info-value">{formData.enrollment_number}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EDIT FORM (Keep existing form code) */}
        {(isCreatingNew || isEditing) && (
          <form id="studentForm" onSubmit={handleSubmit}>
            <h3 className="section-label">Personal Information</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="studentFirstName" className="required">First Name</label>
                <input
                  type="text"
                  id="studentFirstName"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentLastName" className="required">Last Name</label>
                <input
                  type="text"
                  id="studentLastName"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentPhone">Phone Number</label>
                <input
                  type="tel"
                  id="studentPhone"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentDOB">Date of Birth</label>
                <input
                  type="date"
                  id="studentDOB"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentGender">Gender</label>
                <select
                  id="studentGender"
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
            </div>

            <h3 className="section-label">Educational Information</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="studentQualification" className="required">Qualification</label>
                <input
                  type="text"
                  id="studentQualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                  placeholder="e.g., B.Tech, B.Sc, M.Sc, etc."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentEnrollment">Enrollment Number</label>
                <input
                  type="text"
                  id="studentEnrollment"
                  name="enrollment_number"
                  value={formData.enrollment_number}
                  onChange={handleChange}
                  placeholder="University enrollment number"
                  disabled={loading}
                />
              </div>
            </div>

            <h3 className="section-label">Social Links</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="studentGithub">GitHub URL</label>
                <input
                  type="url"
                  id="studentGithub"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentLinkedin">LinkedIn URL</label>
                <input
                  type="url"
                  id="studentLinkedin"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  disabled={loading}
                />
              </div>
            </div>

            <h3 className="section-label">Bio</h3>
            <div className="fields-grid">
              <div className="form-group full-width">
                <label htmlFor="studentBio">Bio / About Me</label>
                <textarea
                  id="studentBio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about your educational background, interests, and goals..."
                  rows="4"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              {isEditing && profileExists && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={resetForm}
                disabled={loading}
              >
                {profileExists ? 'Reset' : 'Clear'}
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                id="studentSubmitBtn"
                disabled={loading}
              >
                {loading 
                  ? 'Saving...' 
                  : profileExists 
                    ? 'Update Profile' 
                    : 'Create Profile'
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;