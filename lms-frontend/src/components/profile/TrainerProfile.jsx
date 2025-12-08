import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

const TrainerProfile = ({ showMessage, onProfileCreated, profileExists, setProfileExists }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
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

      console.log('Fetching trainer profile...'); // Debug

      const response = await axios.get(`${API_BASE_URL}/profiles/trainer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data;
      console.log('Profile fetched:', data); // Debug
      
      setProfileData(data);
      setProfileExists(true);
      setSkills(data.skills || []);
      setIsEditing(false); // Set to view mode when profile exists

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

      showMessage('success', 'Profile loaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No profile found - showing create form'); // Debug
        setProfileExists(false);
        setIsCreatingNew(true);
        setIsEditing(true); // Set to edit mode for new profile
        showMessage('info', 'Please create your trainer profile');
      } else if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 1500);
      } else {
        console.error('Error fetching profile:', error);
        showMessage('error', 'Failed to load profile. Please try again.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.qualification) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const endpoint = `${API_BASE_URL}/profiles/trainer`;
      const method = profileExists ? 'PATCH' : 'POST';

      const dataToSubmit = { 
        ...formData, 
        skills,
        experience_years: parseInt(formData.experience_years) || 0
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

      // Update local state with response
      setProfileData(updatedData);
      setProfileExists(true);
      setIsCreatingNew(false);
      setIsEditing(false);
      setFormData({
        first_name: updatedData.first_name || '',
        last_name: updatedData.last_name || '',
        phone_number: updatedData.phone_number || '',
        experience_years: updatedData.experience_years || 0,
        qualification: updatedData.qualification || '',
        bio: updatedData.bio || '',
        profile_image_url: imageUrl || ''
      });
      setSkills(updatedData.skills || []);

      // small re-render trick (keeps loading logic consistent)
      setLoading(prev => !prev);
      setLoading(false);

      onProfileCreated();
      showMessage('success', 'Profile saved successfully!');

      // Redirect to trainer dashboard after a short delay (do not log out)
      setTimeout(() => {
        navigate('/trainer-dashboard', { replace: true });
      }, 300);

    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error response:', error.response);

      if (error.response?.status === 400) {
        showMessage('error', 'Invalid data. Please check your inputs.');
      } else if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
      } else if (error.response?.status === 422) {
        showMessage('error', 'Validation error. Please check all fields.');
      } else {
        showMessage('error', error.response?.data?.detail || 'Failed to save profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form to current profile data
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
    showMessage('info', 'Edit cancelled');
  };

  const resetForm = () => {
    if (profileData && isEditing) {
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
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        experience_years: 0,
        qualification: '',
        bio: '',
        profile_image_url: ''
      });
      setSkills([]);
    }
    showMessage('info', 'Form reset');
  };

  const getAvatarInitials = () => {
    const firstInitial = formData.first_name?.[0] || '';
    const lastInitial = formData.last_name?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'T';
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
        // Update both profileData and formData with the new image URL
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

  if (loading) return <div className="loading">Loading trainer profile...</div>;

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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileSelected}
          />

          {/* Only show upload button when in edit mode */}
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
            {profileExists ? `${formData.first_name} ${formData.last_name}`.trim() || 'Trainer' : 'Create Your Profile'}
          </h2>
          <span id="userInfo">
            {profileExists
              ? (formData.experience_years > 0 ? `${formData.experience_years} years experience` : 'Trainer')
              : 'Complete the form below to get started'
            }
            {profileExists && formData.qualification && ` | ${formData.qualification}`}
          </span>
        </div>
        
        {/* Edit Button at Top Right (only in view mode) */}
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
            Welcome! This is your first time here. Please create your trainer profile.
          </div>
        )}

        {/* VIEW MODE - Show profile details in list format */}
        {profileExists && !isEditing && (
          <div className="profile-details-list">
            <div className="profile-detail-item">
              <div className="detail-label">First Name</div>
              <div className="detail-value">{formData.first_name}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Last Name</div>
              <div className="detail-value">{formData.last_name}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Phone Number</div>
              <div className="detail-value">{formData.phone_number || 'Not specified'}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Experience</div>
              <div className="detail-value">{formData.experience_years} years</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Qualification</div>
              <div className="detail-value">{formData.qualification}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Skills</div>
              <div className="detail-value">
                {skills.length > 0 ? (
                  <div className="skills-list">
                    {skills.map((skill, index) => (
                      <span key={index} className="skill-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                    No skills added yet
                  </span>
                )}
              </div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Bio / Professional Summary</div>
              <div className="detail-value bio">
                {formData.bio || 'No bio provided'}
              </div>
            </div>
          </div>
        )}

        {/* EDIT/CREATE MODE - Show form */}
        {(isCreatingNew || isEditing) && (
          <form id="trainerForm" onSubmit={handleSubmit}>
            <h3 className="section-label">Personal Information</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="trainerFirstName" className="required">First Name</label>
                <input
                  type="text"
                  id="trainerFirstName"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="trainerLastName" className="required">Last Name</label>
                <input
                  type="text"
                  id="trainerLastName"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="trainerPhone" className="required">Phone Number</label>
                <input
                  type="tel"
                  id="trainerPhone"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="trainerExperience" className="required">Experience (Years)</label>
                <input
                  type="number"
                  id="trainerExperience"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  required
                />
              </div>
            </div>

            <h3 className="section-label">Professional Information</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="trainerQualification" className="required">Qualification</label>
                <input
                  type="text"
                  id="trainerQualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="trainerSkills">Skills</label>
                <div className="skills-container" id="skillsContainer">
                  {skills.map((skill, index) => (
                    <div key={index} className="skill-tag">
                      {skill}
                      <span className="remove-skill" onClick={() => removeSkill(index)}>×</span>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  id="trainerSkillInput"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleSkillKeyPress}
                  placeholder="Add a skill and press Enter"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="trainerBio">Bio / Professional Summary</label>
                <textarea
                  id="trainerBio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Describe your professional background and expertise..."
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
                id="trainerSubmitBtn"
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

export default TrainerProfile;