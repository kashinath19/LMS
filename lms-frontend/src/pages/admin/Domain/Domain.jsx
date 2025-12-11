import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import './Domain.css';

const Domain = () => {
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
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    // Show success message with auto-dismiss
    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    useEffect(() => {
        fetchDomains();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination]);

    const normalizeListFromResponse = (resp) => {
        const d = resp?.data ?? resp;
        if (Array.isArray(d)) return d;
        if (d?.results && Array.isArray(d.results)) return d.results;
        if (d?.data && Array.isArray(d.data)) return d.data;
        if (d?.items && Array.isArray(d.items)) return d.items;
        if (d && typeof d === 'object') {
            const arr = Object.values(d).find(v => Array.isArray(v));
            if (Array.isArray(arr)) return arr;
        }
        return [];
    };

    const fetchDomains = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                skip: pagination.skip,
                limit: pagination.limit,
                active_only: pagination.active_only
            };

            const resp = await api.get('/domains', { params });
            const list = normalizeListFromResponse(resp);
            setDomains(list);
        } catch (err) {
            console.error('Error fetching domains:', err);
            if (err?.response?.status === 401) {
                setError('Session expired. Please log in again.');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_email');
                setTimeout(() => window.location.href = '/login', 1200);
            } else if (err?.response?.status === 403) {
                const detail = err.response?.data?.detail || 'Admin access required';
                setError(detail);
            } else {
                setError(err.message || 'Failed to fetch domains');
            }
            setDomains([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (domainId) => {
        // Navigate to topics page with domain ID
        navigate(`/admin/domains/${domainId}/topics`);
    };

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
            const payload = {
                name: newDomain.name.trim(),
                description: newDomain.description.trim(),
                duration_weeks: parseInt(newDomain.duration_weeks),
                is_active: newDomain.is_active
            };

            const resp = await api.post('/domains', payload);
            const created = resp?.data || resp;

            // Show success message
            showSuccessMessage(`Domain "${created.name || created.title || 'New Domain'}" created successfully!`);

            // Reset form and refresh
            setNewDomain({ name: '', description: '', duration_weeks: 12, is_active: true });
            setShowForm(false);
            setFormErrors({});
            fetchDomains();
        } catch (err) {
            console.error('Error creating domain:', err);
            let errorMessage = 'Failed to create domain';
            const respData = err?.response?.data;
            if (err?.response?.status === 403) {
                errorMessage = respData?.detail || 'Admin access required';
            } else if (err?.response?.status === 409) {
                errorMessage = 'Domain name already exists';
            } else if (respData?.detail && Array.isArray(respData.detail)) {
                errorMessage = respData.detail.map(e => e.msg || e).join(', ');
            } else if (respData?.detail) {
                errorMessage = respData.detail;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setFormErrors({ submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditDomain = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            const payload = {
                name: newDomain.name.trim(),
                description: newDomain.description.trim(),
                duration_weeks: parseInt(newDomain.duration_weeks),
                is_active: newDomain.is_active
            };

            const resp = await api.patch(`/domains/${editingDomainId}`, payload);
            const updated = resp?.data || resp;

            // Show success message
            showSuccessMessage(`Domain "${updated.name || updated.title || 'Domain'}" updated successfully!`);

            // Reset form and refresh
            setIsEditMode(false);
            setEditingDomainId(null);
            setShowForm(false);
            fetchDomains();
        } catch (err) {
            console.error('Error updating domain:', err);
            const respData = err?.response?.data;
            const msg = respData?.detail || err.message || 'Failed to update domain';
            setFormErrors({ submit: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInit = (domain) => {
        console.log('Delete button clicked for domain:', domain);

        // Set the domain to delete and show modal immediately
        setDomainToDelete(domain);
        setDeleteMessage(`Are you sure you want to delete domain "${domain.name || domain.title}"? This action cannot be undone.`);
        setDeleteConfirmation(false);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!domainToDelete) {
            console.error('No domain selected for deletion');
            alert('Error: No domain selected');
            return;
        }

        if (!deleteConfirmation) {
            // As a fallback, ask window.confirm if modal wasn't properly shown or checkbox wasn't checked
            const ok = window.confirm(`Are you sure you want to delete "${domainToDelete.name || domainToDelete.title}"? This action is permanent and cannot be undone.`);
            if (!ok) {
                alert('Delete cancelled.');
                return;
            }
            // If user confirms via window.confirm, set deleteConfirmation to true to proceed
            setDeleteConfirmation(true);
        }

        setIsDeleting(true);
        try {
            console.log('Deleting domain:', domainToDelete.id);

            // Try with confirm parameter first
            try {
                const response = await api.delete(`/domains/${domainToDelete.id}`, {
                    params: { confirm: true }
                });
                console.log('Delete response with confirm:', response);
            } catch (confirmError) {
                // If confirm parameter fails, try without it
                console.log('Delete with confirm param failed, trying without:', confirmError);
                const response = await api.delete(`/domains/${domainToDelete.id}`);
                console.log('Delete response without confirm:', response);
            }

            // Show success message
            showSuccessMessage(`Domain "${domainToDelete.name || domainToDelete.title}" deleted successfully!`);

            // Close modal and refresh
            setShowDeleteModal(false);
            setDomainToDelete(null);
            setDeleteConfirmation(false);
            fetchDomains();
        } catch (err) {
            console.error('Delete confirm error:', err);
            const errorMsg = err?.response?.data?.detail || err.message || 'Failed to delete domain';
            alert(`Error: ${errorMsg}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStartEdit = (domain) => {
        setIsEditMode(true);
        setEditingDomainId(domain.id || domain._id);
        setNewDomain({
            name: domain.name || domain.title || '',
            description: domain.description || '',
            duration_weeks: domain.duration_weeks || 12,
            is_active: domain.is_active ?? true
        });
        setShowForm(true);
        setFormErrors({});
    };

    const handleToggleActiveFilter = () => {
        setPagination(prev => ({
            ...prev,
            active_only: !prev.active_only
        }));
    };

    // Toggle domain active/inactive status inline
    const handleToggleActive = async (domain, e) => {
        if (e) e.stopPropagation();

        const domainId = domain.id || domain._id;
        const newStatus = !domain.is_active;

        try {
            await api.patch(`/domains/${domainId}/toggle-status`);

            // Update local state optimistically
            setDomains(prev => prev.map(d =>
                (d.id === domainId || d._id === domainId)
                    ? { ...d, is_active: newStatus }
                    : d
            ));

            showSuccessMessage(`Domain "${domain.name || domain.title}" is now ${newStatus ? 'Active' : 'Inactive'}`);
        } catch (err) {
            console.error('Error toggling domain status:', err);
            const errorMsg = err?.response?.data?.detail || err.message || 'Failed to toggle status';
            setSuccessMessage('');
            alert(`Error: ${errorMsg}`);
            // Refresh to get correct state
            fetchDomains();
        }
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

    // Calculate total hours (assuming 4 hours per week)
    const calculateTotalHours = (durationWeeks) => {
        return (durationWeeks || 0) * 4;
    };

    // Handle retry
    const handleRetry = () => {
        setError(null);
        fetchDomains();
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

    if (loading) {
        return (
            <div className="domain-management">
                <div className="domain-header">
                    <div className="header-left">
                        <h1>Domain Management</h1>
                        <p>Loading domains...</p>
                    </div>
                </div>
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="domain-management">
            {/* Success Message Toast */}
            {successMessage && (
                <div className="success-toast">
                    <span className="success-icon">✓</span>
                    <span>{successMessage}</span>
                    <button
                        type="button"
                        className="toast-close"
                        onClick={() => setSuccessMessage('')}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="domain-header">
                <div className="header-left">
                    <h1>Domain Management</h1>
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
                                setShowForm(true);
                            }}
                        >
                            + Add New Domain
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Messages */}
            {error && (
                <div className="error-message">
                    <p>Error: {error}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                        <button className="btn btn-primary" onClick={handleRetry}>
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Domain Form displayed as a top-right popup */}
            {showForm && (
                <div
                    className="form-modal-overlay"
                    onClick={() => !isSubmitting && resetForm()}
                >
                    <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="card add-domain-form">
                            <div className="card-header">
                                <h3>{isEditMode ? 'Edit Domain' : 'Add New Domain'}</h3>
                                <button className="close-btn" onClick={resetForm} disabled={isSubmitting}>×</button>
                            </div>
                            <div className="card-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="domainName">Domain Name *</label>
                                        <input
                                            type="text"
                                            id="domainName"
                                            name="domainName"
                                            className={`form-control ${formErrors.name ? 'invalid' : ''}`}
                                            placeholder="Enter domain name"
                                            value={newDomain.name}
                                            onChange={(e) => {
                                                setNewDomain({ ...newDomain, name: e.target.value });
                                                if (formErrors.name) {
                                                    setFormErrors({ ...formErrors, name: null });
                                                }
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="durationWeeks">Duration (Weeks) *</label>
                                        <input
                                            type="number"
                                            id="durationWeeks"
                                            name="durationWeeks"
                                            className={`form-control ${formErrors.duration_weeks ? 'invalid' : ''}`}
                                            placeholder="e.g., 12"
                                            min="1"
                                            max="52"
                                            value={newDomain.duration_weeks}
                                            onChange={(e) => {
                                                setNewDomain({ ...newDomain, duration_weeks: parseInt(e.target.value) || 12 });
                                                if (formErrors.duration_weeks) {
                                                    setFormErrors({ ...formErrors, duration_weeks: null });
                                                }
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.duration_weeks && <span className="error-text">{formErrors.duration_weeks}</span>}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="domainDescription">Description</label>
                                    <textarea
                                        id="domainDescription"
                                        name="domainDescription"
                                        className="form-control"
                                        rows="3"
                                        placeholder="Enter domain description (optional)"
                                        value={newDomain.description}
                                        onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="domainStatus">Status</label>
                                    <select
                                        id="domainStatus"
                                        name="domainStatus"
                                        className="form-control"
                                        value={newDomain.is_active}
                                        onChange={(e) => setNewDomain({ ...newDomain, is_active: e.target.value === 'true' })}
                                        disabled={isSubmitting}
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
                                    <button className="btn btn-secondary" onClick={resetForm} disabled={isSubmitting}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="delete-modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
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
                                    <div className="delete-warning">
                                        <h4>Delete Domain: {domainToDelete.name || domainToDelete.title}</h4>
                                        <p>{deleteMessage || "Are you sure you want to delete this domain? This action cannot be undone."}</p>
                                    </div>

                                    <div className="domain-preview">
                                        <h5>Domain Details</h5>
                                        <div className="preview-grid">
                                            <div className="preview-item">
                                                <span className="preview-label">Domain Code:</span>
                                                <span className="preview-value">{generateDomainCode(domainToDelete.name || domainToDelete.title)}</span>
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
                                            <input
                                                type="checkbox"
                                                id="confirmDelete"
                                                name="confirmDelete"
                                                checked={deleteConfirmation}
                                                onChange={(e) => setDeleteConfirmation(e.target.checked)}
                                                required
                                            />
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
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting || !domainToDelete || !deleteConfirmation}
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

            {/* Domains Grid */}
            {!error && (
                <div className="domains-grid">
                    {domains.length === 0 ? (
                        <div className="no-domains">
                            <div className="empty-state-icon">📚</div>
                            <h4>No domains found</h4>
                            <p>{pagination.active_only ? 'No active domains found. Try showing all domains or create a new one.' : 'No domains found. Create your first domain!'}</p>
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
                                key={domain.id || domain._id}
                                className="domain-card"
                            >
                                <div className="domain-image" style={{ background: getGradientColor(domain.id || domain._id) }}>
                                    <div className="domain-code">
                                        {generateDomainCode(domain.name || domain.title)}
                                    </div>
                                    <div className="domain-actions-overlay">
                                        <button
                                            type="button"
                                            className="btn-icon btn-edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEdit(domain);
                                            }}
                                            title="Edit Domain"
                                            aria-label={`Edit domain ${domain.name || domain.title || ''}`}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-icon btn-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteInit(domain);
                                            }}
                                            title="Delete Domain"
                                            aria-label={`Delete domain ${domain.name || domain.title || ''}`}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="domain-content">
                                    <div className="domain-meta">
                                        <button
                                            type="button"
                                            className={`badge-toggle ${domain.is_active ? 'badge-success' : 'badge-warning'}`}
                                            onClick={(e) => handleToggleActive(domain, e)}
                                            title={`Click to ${domain.is_active ? 'deactivate' : 'activate'} this domain`}
                                            aria-label={`Toggle ${domain.name || domain.title} status`}
                                        >
                                            {domain.is_active ? '✓ Active' : '○ Inactive'}
                                        </button>
                                        <span>{formatWeeks(domain.duration_weeks)}</span>
                                    </div>
                                    <h4>{domain.name || domain.title}</h4>
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
                                        <button
                                            type="button"
                                            className="view-domain view-link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(domain.id || domain._id);
                                            }}
                                            aria-label={`View details for ${domain.name || domain.title || ''}`}
                                        >
                                            View Details →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Domain;