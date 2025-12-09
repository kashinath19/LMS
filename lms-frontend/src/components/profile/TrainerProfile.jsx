import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './TrainerProfile.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

const TrainerProfile = ({ showMessage, onProfileCreated, profileExists, setProfileExists }) => {
  const { user } = useAuth();
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

  // local toast for inline "Changes saved" replication
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showToast]);

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/profiles/trainer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data;
      setProfileData(data);
      setProfileExists(true);
      setSkills(data.skills || []);
      setIsEditing(false);

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

      if (showMessage) showMessage('success', 'Profile loaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        setProfileExists(false);
        setIsCreatingNew(true);
        setIsEditing(true);
        if (showMessage) showMessage('info', 'Please create your trainer profile');
      } else if (error.response?.status === 401) {
        if (showMessage) showMessage('error', 'Session expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 1500);
      } else {
        if (showMessage) showMessage('error', 'Failed to load profile. Please try again.');
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
      if (showMessage) showMessage('error', 'Please fill in all required fields');
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

      if (onProfileCreated) onProfileCreated();
      if (showMessage) showMessage('success', 'Profile saved successfully!');
      // local toast
      setToastMessage('Changes saved successfully');
      setShowToast(true);
    } catch (error) {
      if (error.response?.status === 400) {
        if (showMessage) showMessage('error', 'Invalid data. Please check your inputs.');
      } else if (error.response?.status === 401) {
        if (showMessage) showMessage('error', 'Session expired. Please login again.');
      } else if (error.response?.status === 422) {
        if (showMessage) showMessage('error', 'Validation error. Please check all fields.');
      } else {
        if (showMessage) showMessage('error', error.response?.data?.detail || 'Failed to save profile');
      }
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
        experience_years: profileData.experience_years || 0,
        qualification: profileData.qualification || '',
        bio: profileData.bio || '',
        profile_image_url: imageUrl || ''
      });
      setSkills(profileData.skills || []);
    }
    setIsEditing(false);
    if (showMessage) showMessage('info', 'Edit cancelled');
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
    if (showMessage) showMessage('info', 'Form reset');
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
        if (showMessage) showMessage('error', 'Upload succeeded but no image URL returned.');
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
        if (showMessage) showMessage('success', 'Profile photo uploaded');
        setToastMessage('Changes saved successfully');
        setShowToast(true);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        if (showMessage) showMessage('error', 'Session expired. Please login again.');
      } else {
        if (showMessage) showMessage('error', error.response?.data?.detail || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Loading trainer profile...</div>;

  return (
    <div className="trainer-page">
      <div className="top-nav">
        {showToast && (
          <div className="toast" role="status" aria-live="polite">
            <i className="fa-solid fa-check" />
            {toastMessage}
          </div>
        )}
      </div>

      <div className="profile-card">
        <div className="left-column">
          <div className="avatar-container">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile Avatar" />
            ) : (
              <div className="avatar-placeholder">{getAvatarInitials()}</div>
            )}
          </div>

          <h2>{`${formData.first_name || 'Trainer'} ${formData.last_name || ''}`.trim()}</h2>
          <p className="email">{user?.email || formData.email || ''}</p>
          <p className="phone">{formData.phone_number || ''}</p>

          <br />
          <div className="student-id-badge">
            {profileData?.id || user?.id || 'TR-XXXXX'}
          </div>

          {(isCreatingNew || isEditing) && (
            <>
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
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </>
          )}
        </div>

        <div className="right-column">
          <div className="header-row">
            <h1>Profile Details</h1>
            {!isEditing && profileExists && (
              <button className="btn-edit" onClick={handleEdit}>
                <i className="fa-solid fa-pen" /> Edit Profile
              </button>
            )}
          </div>

          {!isEditing && profileExists && (
            <>
              <h3 className="section-title">Personal Information</h3>
              <div className="divider" />
              <div className="info-grid">
                <div className="info-item">
                  <label>Qualification</label>
                  <p>{formData.qualification || 'Not specified'}</p>
                </div>

                <div className="info-item">
                  <label>Experience</label>
                  <p>{formData.experience_years ? `${formData.experience_years} years` : 'Not specified'}</p>
                </div>

                <div className="info-item">
                  <label>Phone</label>
                  <p>{formData.phone_number || 'Not specified'}</p>
                </div>
              </div>

              <div className="bio-section">
                <label>Bio</label>
                <p>{formData.bio || 'No bio provided'}</p>
              </div>

              <h3 className="section-title">Social Links</h3>
              <div className="divider" />
              <div className="social-icons">
                <a href={profileData?.github_url || '#'} target="_blank" rel="noreferrer"><i className="fa-brands fa-github" /></a>
                <a href={profileData?.linkedin_url || '#'} target="_blank" rel="noreferrer"><i className="fa-brands fa-linkedin" /></a>
              </div>
            </>
          )}

          {(isCreatingNew || isEditing) && (
            <form id="trainerForm" onSubmit={handleSubmit}>
              <h3 className="section-title">Personal Information</h3>
              <div className="divider" />

              <div className="info-grid">
                <div className="form-group">
                  <label htmlFor="trainerFirstName" className="required">First Name</label>
                  <input type="text" id="trainerFirstName" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="trainerLastName" className="required">Last Name</label>
                  <input type="text" id="trainerLastName" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="trainerPhone" className="required">Phone Number</label>
                  <input type="tel" id="trainerPhone" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="trainerExperience" className="required">Experience (Years)</label>
                  <input type="number" id="trainerExperience" name="experience_years" value={formData.experience_years} onChange={handleChange} min="0" max="50" required />
                </div>
              </div>

              <h3 className="section-title">Professional Information</h3>
              <div className="divider" />

              <div className="form-group">
                <label htmlFor="trainerQualification" className="required">Qualification</label>
                <input type="text" id="trainerQualification" name="qualification" value={formData.qualification} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="trainerSkills">Skills</label>
                <div className="skills-container">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="skill-tag">
                      {skill}
                      <span className="remove-skill" onClick={() => removeSkill(idx)}>×</span>
                    </div>
                  ))}
                </div>
                <input type="text" id="trainerSkillInput" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={handleSkillKeyPress} placeholder="Add a skill and press Enter" />
              </div>

              <div className="form-group">
                <label htmlFor="trainerBio">Bio / Professional Summary</label>
                <textarea id="trainerBio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Describe your professional background and expertise..." />
              </div>

              <div className="form-actions">
                {isEditing && profileExists && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={loading}>Cancel</button>
                )}
                <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                  {profileExists ? 'Reset' : 'Clear'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : profileExists ? 'Update Profile' : 'Create Profile'}
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