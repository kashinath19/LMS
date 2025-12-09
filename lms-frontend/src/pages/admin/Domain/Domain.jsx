import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Domain.css';

const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

const Domain = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDomainId, setEditingDomainId] = useState(null);
  const [newDomain, setNewDomain] = useState({ 
    name: '', 
    description: '',
    duration_weeks: 12,
    is_active: true
  });
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 100,
    active_only: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('access_token') || 
           sessionStorage.getItem('access_token') ||
           localStorage.getItem('token') || 
           sessionStorage.getItem('token');
  };

  // Fetch domains from backend
  useEffect(() => {
    fetchDomains();
  }, [pagination]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams({
        skip: pagination.skip.toString(),
        limit: pagination.limit.toString(),
        active_only: pagination.active_only.toString()
      }).toString();
      
      const response = await fetch(
        `${API_BASE_URL}/domains/?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('token');
          setError('Session expired. Please log in again.');
        } else if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (response.status === 404) {
          setError('API endpoint not found');
        } else {
          setError(`Failed to fetch domains: ${response.status} ${response.statusText}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDomains(data);
    } catch (err) {
      if (!error) {
        setError(err.message);
      }
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDomain = (domainId) => {
    navigate(`/admin/domains/${domainId}/topics`);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!newDomain.name.trim()) {
      errors.name = 'Domain name is required';
    } else if (newDomain.name.trim().length < 3) {
      errors.name = 'Domain name must be at least 3 characters';
    }
    
    if (!newDomain.duration_weeks) {
      errors.duration_weeks = 'Duration is required';
    } else if (newDomain.duration_weeks < 1) {
      errors.duration_weeks = 'Duration must be at least 1 week';
    } else if (newDomain.duration_weeks > 52) {
      errors.duration_weeks = 'Duration cannot exceed 52 weeks';
    }
    
    return errors;
  };

  const handleAddDomain = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const token = getAuthToken();
      
      if (!token) {
        alert('Authentication required. Please log in.');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/domains/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDomain.name.trim(),
          description: newDomain.description.trim(),
          duration_weeks: parseInt(newDomain.duration_weeks),
          is_active: newDomain.is_active
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create domain';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (response.status === 409) {
              errorMessage = 'Domain name already exists';
            } else if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const createdDomain = await response.json();
      
      alert(`Domain "${createdDomain.name}" created successfully!`);
      setNewDomain({ 
        name: '', 
        description: '', 
        duration_weeks: 12,
        is_active: true 
      });
      setShowForm(false);
      setFormErrors({});
      
      // Refresh the domains list
      fetchDomains();
    } catch (err) {
      setFormErrors({ submit: err.message });
      console.error('Error creating domain:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Domain
  const handleEditDomain = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const token = getAuthToken();
      
      if (!token) {
        alert('Authentication required. Please log in.');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/domains/${editingDomainId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDomain.name.trim(),
          description: newDomain.description.trim(),
          duration_weeks: parseInt(newDomain.duration_weeks),
          is_active: newDomain.is_active
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update domain';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (response.status === 409) {
              errorMessage = 'Domain name already exists';
            } else if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const updatedDomain = await response.json();
      
      alert(`Domain "${updatedDomain.name}" updated successfully!`);
      
      // Update domain in state
      setDomains(domains.map(domain => 
        domain.id === editingDomainId ? updatedDomain : domain
      ));
      
      resetForm();
    } catch (err) {
      setFormErrors({ submit: err.message });
      console.error('Error updating domain:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Domain
  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;

    setIsDeleting(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert('Authentication required. Please log in.');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/domains/${domainToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete domain';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Remove domain from state
      setDomains(domains.filter(domain => domain.id !== domainToDelete.id));
      
      alert(`Domain "${domainToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setDomainToDelete(null);
    } catch (err) {
      alert(`Error deleting domain: ${err.message}`);
      console.error('Error deleting domain:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActiveFilter = () => {
    setPagination(prev => ({
      ...prev,
      active_only: !prev.active_only
    }));
  };

  const handleRetry = () => {
    setError(null);
    fetchDomains();
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Start edit mode
  const startEditDomain = (domain) => {
    setIsEditMode(true);
    setEditingDomainId(domain.id);
    setNewDomain({
      name: domain.name || '',
      description: domain.description || '',
      duration_weeks: domain.duration_weeks || 12,
      is_active: domain.is_active !== undefined ? domain.is_active : true
    });
    setShowForm(true);
    setFormErrors({});
  };

  // Confirm delete
  const confirmDeleteDomain = (domain) => {
    setDomainToDelete(domain);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingDomainId(null);
    setNewDomain({ 
      name: '', 
      description: '', 
      duration_weeks: 12,
      is_active: true 
    });
    setFormErrors({});
    setShowForm(false);
  };

  // Helper function to get gradient color based on domain ID
  const getGradientColor = (id) => {
    const gradients = [
      'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
      'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
    ];
    
    if (!id) return gradients[0];
    
    const idString = typeof id === 'string' ? id : String(id);
    const index = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  // Format weeks display
  const formatWeeks = (durationWeeks) => {
    const weeks = durationWeeks || 0;
    return `${weeks} Week${weeks !== 1 ? 's' : ''}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Generate domain code from name
  const generateDomainCode = (name) => {
    if (!name) return 'DOM';
    
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else if (name.length >= 3) {
      return name.substring(0, 3).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'DM';
  };

  // Calculate total hours (assuming 4 hours per week)
  const calculateTotalHours = (durationWeeks) => {
    return (durationWeeks || 0) * 4;
  };

  if (loading) {
    return (
      <div className="domain-management">
        <div className="domain-header">
          <div className="header-left">
            <h1>Domains Management</h1>
            <p>Loading domains...</p>
          </div>
        </div>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="domain-management">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Domain Deletion</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {domainToDelete ? (
                <>
                  <div className="warning-message">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                      <h4>Delete Domain: {domainToDelete.name}</h4>
                      <p>Are you sure you want to delete this domain? This action cannot be undone.</p>
                    </div>
                  </div>
                  
                  <div className="domain-preview">
                    <h5>Domain Details</h5>
                    <div className="preview-grid">
                      <div className="preview-item">
                        <span className="preview-label">Domain Code:</span>
                        <span className="preview-value">{generateDomainCode(domainToDelete.name)}</span>
                      </div>
                      <div className="preview-item">
                        <span className="preview-label">Duration:</span>
                        <span className="preview-value">{formatWeeks(domainToDelete.duration_weeks)}</span>
                      </div>
                      <div className="preview-item">
                        <span className="preview-label">Status:</span>
                        <span className={`preview-value ${domainToDelete.is_active ? 'status-active' : 'status-inactive'}`}>
                          {domainToDelete.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="preview-item">
                        <span className="preview-label">Created:</span>
                        <span className="preview-value">{formatDate(domainToDelete.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="cascade-warning">
                    <h5>⚠️ Important Warning:</h5>
                    <p>This action will <strong>permanently delete</strong> the domain and all associated data:</p>
                    <ul>
                      <li>All modules under this domain</li>
                      <li>All topics and content</li>
                      <li>Student progress and records</li>
                      <li>All related data (cascading delete)</li>
                    </ul>
                    <p className="final-warning">This action cannot be undone!</p>
                  </div>
                  
                  <div className="confirmation-section">
                    <label>
                      <input type="checkbox" id="confirmDelete" required />
                      <span>I understand this action is permanent and cannot be undone</span>
                    </label>
                  </div>
                </>
              ) : (
                <p>Loading domain information...</p>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={handleDeleteDomain}
                disabled={isDeleting || !domainToDelete}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Domain'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="domain-header">
        <div className="header-left">
          <h1>Domains Management</h1>
          <p>Manage and organize all learning domains</p>
        </div>
        <div className="header-right">
          <div className="filter-controls">
            <button 
              className={`btn ${pagination.active_only ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleActiveFilter}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {pagination.active_only ? 'Show All' : 'Active Only'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
            >
              + Add New Domain
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Error */}
      {error && error.includes('Authentication') && (
        <div className="error-message">
          <p>Error: {error}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleLoginRedirect}>
              Go to Login
            </button>
            <button className="btn btn-secondary" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Other Errors */}
      {error && !error.includes('Authentication') && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button className="btn btn-primary" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Add/Edit Domain Form */}
      {showForm && (
        <div className="card add-domain-form">
          <div className="card-header">
            <h3>{isEditMode ? 'Edit Domain' : 'Add New Domain'}</h3>
            <button className="close-btn" onClick={resetForm}>×</button>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="domainName">Domain Name </label>
                <input
                  type="text"
                  id="domainName"
                  className={`form-control ${formErrors.name ? 'invalid' : ''}`}
                  placeholder="Enter domain name"
                  value={newDomain.name}
                  onChange={(e) => {
                    setNewDomain({...newDomain, name: e.target.value});
                    if (formErrors.name) {
                      setFormErrors({...formErrors, name: null});
                    }
                  }}
                  required
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="durationWeeks">Duration (Weeks) </label>
                <input
                  type="number"
                  id="durationWeeks"
                  className={`form-control ${formErrors.duration_weeks ? 'invalid' : ''}`}
                  placeholder="e.g., 12"
                  min="1"
                  max="52"
                  value={newDomain.duration_weeks}
                  onChange={(e) => {
                    setNewDomain({...newDomain, duration_weeks: parseInt(e.target.value) || 12});
                    if (formErrors.duration_weeks) {
                      setFormErrors({...formErrors, duration_weeks: null});
                    }
                  }}
                  required
                />
                {formErrors.duration_weeks && <span className="error-text">{formErrors.duration_weeks}</span>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="domainDescription">Description</label>
              <textarea
                id="domainDescription"
                className="form-control"
                rows="3"
                placeholder="Enter domain description (optional)"
                value={newDomain.description}
                onChange={(e) => setNewDomain({...newDomain, description: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label htmlFor="domainStatus">Status</label>
              <select
                id="domainStatus"
                className="form-control"
                value={newDomain.is_active}
                onChange={(e) => setNewDomain({...newDomain, is_active: e.target.value === 'true'})}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            {formErrors.submit && (
              <div className="error-text" style={{ marginBottom: '16px', textAlign: 'center' }}>
                {formErrors.submit}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                className="btn btn-primary" 
                onClick={isEditMode ? handleEditDomain : handleAddDomain}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Domain' : 'Create Domain')
                }
              </button>
              <button className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Only show domains grid if no authentication error */}
      {!error && (
        <>
          {/* Domains Grid */}
          <div className="domains-grid">
            {domains.length === 0 ? (
              <div className="no-domains">
                <p>{pagination.active_only ? 'No active domains found.' : 'No domains found. Create your first domain!'}</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  style={{ marginTop: '16px' }}
                >
                  + Create First Domain
                </button>
              </div>
            ) : (
              domains.map((domain) => (
                <div 
                  key={domain.id}
                  className="domain-card"
                  onClick={() => handleViewDomain(domain.id)}
                >
                  <div className="domain-image" style={{ background: getGradientColor(domain.id) }}>
                    <div className="domain-code">
                      {generateDomainCode(domain.name)}
                    </div>
                    <div className="domain-actions-overlay">
                      <button 
                        className="btn-icon btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditDomain(domain);
                        }}
                        title="Edit Domain"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteDomain(domain);
                        }}
                        title="Delete Domain"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="domain-content">
                    <div className="domain-meta">
                      <span className={`badge ${domain.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {domain.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span>{formatWeeks(domain.duration_weeks)}</span>
                    </div>
                    <h4>{domain.name}</h4>
                    <p className="domain-description">
                      {domain.description || 'No description provided.'}
                    </p>
                    
                    <div className="domain-stats">
                      <div className="stat-item">
                        <div className="stat-number">--</div>
                        <div className="stat-label">Modules</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number">--</div>
                        <div className="stat-label">Students</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number">{calculateTotalHours(domain.duration_weeks)}</div>
                        <div className="stat-label">Hours</div>
                      </div>
                    </div>
                    
                    <div className="domain-footer">
                      <span className="created-date">
                        Created: {formatDate(domain.created_at)}
                      </span>
                      <span className="view-domain">View Topics →</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Domain;