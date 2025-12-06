import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

const StudentProfile = ({ showMessage, onProfileCreated, profileExists, setProfileExists }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    current_education: '',
    institution: '',
    year_of_study: '',
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

      const response = await axios.get(`${API_BASE_URL}/profiles/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data;
      setProfileData(data);
      setProfileExists(true);
      setSkills(data.skills || []);
      setIsEditing(false); // Set to view mode when profile exists

      const imageUrl = extractImageUrl(data);

      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        date_of_birth: data.date_of_birth || '',
        current_education: data.current_education || '',
        institution: data.institution || '',
        year_of_study: data.year_of_study || '',
        bio: data.bio || '',
        profile_image_url: imageUrl || ''
      });

      showMessage('success', 'Student profile loaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        setProfileExists(false);
        setIsCreatingNew(true);
        setIsEditing(true); // Set to edit mode for new profile
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

    if (!formData.first_name || !formData.last_name || !formData.current_education) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const endpoint = `${API_BASE_URL}/profiles/student`;
      const method = profileExists ? 'PATCH' : 'POST';

      const dataToSubmit = { 
        ...formData, 
        skills,
        // Convert date format if needed
        date_of_birth: formData.date_of_birth || null,
        year_of_study: formData.year_of_study ? parseInt(formData.year_of_study) : null
      };

      console.log('Submitting student data:', dataToSubmit); // Debug log

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

      // Update ALL states with the new data
      setProfileData(updatedData);
      setProfileExists(true);
      setIsCreatingNew(false);
      setIsEditing(false); // Switch to view mode after save

      // CRITICAL: Update formData with the response data
      setFormData({
        first_name: updatedData.first_name || '',
        last_name: updatedData.last_name || '',
        phone_number: updatedData.phone_number || '',
        date_of_birth: updatedData.date_of_birth || '',
        current_education: updatedData.current_education || '',
        institution: updatedData.institution || '',
        year_of_study: updatedData.year_of_study || '',
        bio: updatedData.bio || '',
        profile_image_url: imageUrl || ''
      });
      
      // Update skills from response
      setSkills(updatedData.skills || []);

      onProfileCreated();
      showMessage('success', 'Student profile saved successfully!');
    } catch (error) {
      console.error('Error saving student profile:', error);
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
        date_of_birth: profileData.date_of_birth || '',
        current_education: profileData.current_education || '',
        institution: profileData.institution || '',
        year_of_study: profileData.year_of_study || '',
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
        date_of_birth: profileData.date_of_birth || '',
        current_education: profileData.current_education || '',
        institution: profileData.institution || '',
        year_of_study: profileData.year_of_study || '',
        bio: profileData.bio || '',
        profile_image_url: imageUrl || ''
      });
      setSkills(profileData.skills || []);
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        date_of_birth: '',
        current_education: '',
        institution: '',
        year_of_study: '',
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
        // Update both profileData and formData with the new image URL
        setProfileData(prev => ({ 
          ...(prev || {}), 
          profile_image_url: imageUrl 
        }));
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

  // Format date for display
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileSelected}
          />

          <button
            type="button"
            className="upload-btn"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>

        <div className="user-summary">
          <h2 id="userName">
            {profileExists ? `${formData.first_name} ${formData.last_name}`.trim() || 'Student' : 'Create Your Profile'}
          </h2>
          <span id="userInfo">
            {profileExists
              ? (formData.current_education 
                  ? `${formData.current_education} student` 
                  : 'Student')
              : 'Complete the form below to get started'
            }
            {profileExists && formData.institution && ` | ${formData.institution}`}
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
            Welcome! This is your first time here. Please create your student profile.
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
              <div className="detail-label">Date of Birth</div>
              <div className="detail-value">{formatDate(formData.date_of_birth)}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Current Education</div>
              <div className="detail-value">{formData.current_education}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Institution</div>
              <div className="detail-value">{formData.institution || 'Not specified'}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Year of Study</div>
              <div className="detail-value">{formData.year_of_study || 'Not specified'}</div>
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
              <div className="detail-label">Bio / About Me</div>
              <div className="detail-value bio">
                {formData.bio || 'No bio provided'}
              </div>
            </div>
          </div>
        )}

        {/* EDIT/CREATE MODE - Show form */}
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
                />
              </div>
            </div>

            <h3 className="section-label">Educational Information</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="studentEducation" className="required">Current Education</label>
                <select
                  id="studentEducation"
                  name="current_education"
                  value={formData.current_education}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select education level</option>
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Professional">Professional</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="studentInstitution">Institution</label>
                <input
                  type="text"
                  id="studentInstitution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="University or School Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentYear">Year of Study</label>
                <input
                  type="number"
                  id="studentYear"
                  name="year_of_study"
                  value={formData.year_of_study}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  placeholder="e.g., 3"
                />
              </div>
            </div>

            <h3 className="section-label">Skills & Bio</h3>
            <div className="fields-grid">
              <div className="form-group full-width">
                <label htmlFor="studentSkills">Skills</label>
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
                  id="studentSkillInput"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleSkillKeyPress}
                  placeholder="Add a skill and press Enter"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="studentBio">Bio / About Me</label>
                <textarea
                  id="studentBio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about your educational background, interests, and goals..."
                  rows="4"
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