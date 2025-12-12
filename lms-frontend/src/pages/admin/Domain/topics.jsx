import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import Layout from '../../../components/layout/Layout';
import './topics.css';

const Topics = () => {
    const { domainId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { setPageTitle } = useOutletContext();

    // Get domain data from location state or fetch it
    const domainFromState = location.state?.domain;

    // State variables
    const [domain, setDomain] = useState(domainFromState || null);
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    
    // Form Visibility States
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showTopicForm, setShowTopicForm] = useState({}); // For Adding Topics (Inline)
    const [showEditModal, setShowEditModal] = useState(false); // For Editing Topics (Popup)
    
    const [successMessage, setSuccessMessage] = useState('');

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null, moduleId: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    // Data States
    const [activeModuleId, setActiveModuleId] = useState(null); // Track module for the topic being edited
    const [editingModule, setEditingModule] = useState(null);
    const [editingTopic, setEditingTopic] = useState(null); // ID of topic being edited

    // Form Input States
    const [newModule, setNewModule] = useState({
        title: '',
        description: '',
        order_index: 0
    });

    const [newTopic, setNewTopic] = useState({
        title: '',
        content: '',
        resource_link: '',
        order_index: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

    // Helper to show success messages
    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    // Helper to calculate hours from weeks
    const calculateTotalHours = (weeks) => {
        return (weeks || 0) * 4;
    };

    // Fetch domain details and modules
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // If domain not passed in state, fetch it
                if (!domainFromState) {
                    const domainResponse = await axios.get(`${API_BASE_URL}/domains/${domainId}`);
                    setDomain(domainResponse.data);
                }

                // Fetch modules for this domain
                const response = await axios.get(`${API_BASE_URL}/modules/`, {
                    params: { domain_id: domainId }
                });

                // Fetch topics for each module
                const modulesWithTopics = await Promise.all(
                    response.data.map(async (module) => {
                        try {
                            const topicsResponse = await axios.get(`${API_BASE_URL}/topics/`, {
                                params: { module_id: module.id }
                            });
                            return {
                                ...module,
                                topics: topicsResponse.data
                            };
                        } catch (err) {
                            console.error(`Error fetching topics for module ${module.id}:`, err);
                            return {
                                ...module,
                                topics: []
                            };
                        }
                    })
                );

                setModules(modulesWithTopics);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to fetch data');
                console.error('Error fetching data:', err);
                
                if (!domain) {
                    // Fallback mock data
                    setDomain({
                        id: domainId,
                        name: 'Data Science Fundamentals',
                        code: 'DS101',
                        description: 'Master the basics of data science including Python programming.',
                        modules: 4,
                        students: 245,
                        duration_weeks: 12,
                        status: 'Active',
                        trainer: 'Dr. Sarah Johnson'
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [domainId, domainFromState]);

    // Toggle module expansion
    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
        // Only close inline forms (add topic), keep modal state independent
        setShowTopicForm({});
    };

    // Add new module
    const handleAddModule = async () => {
        if (!newModule.title.trim()) {
            alert('Please enter module title');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/modules/`, {
                domain_id: domainId,
                title: newModule.title,
                description: newModule.description,
                order_index: parseInt(newModule.order_index) || 0
            });

            const newModuleWithTopics = { ...response.data, topics: [] };
            setModules(prev => [...prev, newModuleWithTopics]);

            setNewModule({ title: '', description: '', order_index: 0 });
            setShowModuleForm(false);

            if (domain) {
                setDomain(prev => ({ ...prev, modules: (prev.modules || 0) + 1 }));
            }

            showSuccess('Module added successfully!');
        } catch (err) {
            console.error('Error adding module:', err);
            alert(err.response?.data?.detail || 'Failed to add module');
        }
    };

    // Update a module
    const handleUpdateModule = async (moduleId, updatedData) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/modules/${moduleId}`,
                updatedData
            );

            setModules(prev => prev.map(module =>
                module.id === moduleId ? { ...module, ...response.data } : module
            ));

            setEditingModule(null);
            showSuccess('Module updated successfully!');
        } catch (err) {
            console.error('Error updating module:', err);
            alert(err.response?.data?.detail || 'Failed to update module');
        }
    };

    // Initiate Module Deletion
    const initiateDeleteModule = (module) => {
        setDeleteTarget({
            type: 'module',
            id: module.id,
            title: module.title
        });
        setShowDeleteModal(true);
    };

    // Initiate Topic Deletion
    const initiateDeleteTopic = (module, topic) => {
        setDeleteTarget({
            type: 'topic',
            id: topic.id,
            moduleId: module.id,
            title: topic.title
        });
        setShowDeleteModal(true);
    };

    // Confirm Deletion
    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (deleteTarget.type === 'module') {
                await axios.delete(`${API_BASE_URL}/modules/${deleteTarget.id}`);
                setModules(prev => prev.filter(module => module.id !== deleteTarget.id));
                if (domain) setDomain(prev => ({ ...prev, modules: (prev.modules || 0) - 1 }));
                showSuccess('Module deleted successfully!');
            } else if (deleteTarget.type === 'topic') {
                await axios.delete(`${API_BASE_URL}/topics/${deleteTarget.id}`);
                setModules(prev => prev.map(module => {
                    if (module.id === deleteTarget.moduleId) {
                        const updatedTopics = module.topics?.filter(topic => topic.id !== deleteTarget.id) || [];
                        return { ...module, topics: updatedTopics };
                    }
                    return module;
                }));
                showSuccess('Topic deleted successfully!');
            }
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Error deleting item:', err);
            alert(err.response?.data?.detail || 'Failed to delete item');
        } finally {
            setIsDeleting(false);
            setDeleteTarget({ type: null, id: null, moduleId: null, title: '' });
        }
    };

    // Add new topic (Inline)
    const handleAddTopic = async (moduleId) => {
        if (!newTopic.title.trim()) {
            alert('Please enter topic title');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/topics/`, {
                module_id: moduleId,
                title: newTopic.title,
                content: newTopic.content,
                resource_link: newTopic.resource_link,
                order_index: parseInt(newTopic.order_index) || 0
            });

            setModules(prev => prev.map(module => {
                if (module.id === moduleId) {
                    const updatedTopics = [...(module.topics || []), response.data];
                    return { ...module, topics: updatedTopics };
                }
                return module;
            }));

            setNewTopic({ title: '', content: '', resource_link: '', order_index: 0 });
            setShowTopicForm({});
            showSuccess('Topic added successfully!');
        } catch (err) {
            console.error('Error adding topic:', err);
            alert(err.response?.data?.detail || 'Failed to add topic');
        }
    };

    // Update topic (Called from Modal)
    const handleUpdateTopic = async () => {
        if (!activeModuleId || !editingTopic) return;

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/topics/${editingTopic}`,
                newTopic
            );

            setModules(prev => prev.map(module => {
                if (module.id === activeModuleId) {
                    const updatedTopics = module.topics?.map(topic =>
                        topic.id === editingTopic ? { ...topic, ...response.data } : topic
                    ) || [];
                    return { ...module, topics: updatedTopics };
                }
                return module;
            }));

            setShowEditModal(false);
            setEditingTopic(null);
            setActiveModuleId(null);
            setNewTopic({ title: '', content: '', resource_link: '', order_index: 0 });
            showSuccess('Topic updated successfully!');
        } catch (err) {
            console.error('Error updating topic:', err);
            alert(err.response?.data?.detail || 'Failed to update topic');
        }
    };

    // Open Add Topic Form (Inline)
    const openAddTopicForm = (moduleId) => {
        setShowTopicForm({ [moduleId]: true });
        setNewTopic({ title: '', content: '', resource_link: '', order_index: 0 });
    };

    // Open Edit Topic Modal (Popup)
    const startEditTopic = (moduleId, topic) => {
        setActiveModuleId(moduleId);
        setEditingTopic(topic.id);
        setNewTopic({
            title: topic.title,
            content: topic.content,
            resource_link: topic.resource_link,
            order_index: topic.order_index
        });
        setShowEditModal(true);
    };

    const startEditModule = (module) => {
        setEditingModule(module.id);
        setNewModule({
            title: module.title,
            description: module.description,
            order_index: module.order_index
        });
    };

    const handleBack = () => {
        navigate('/admin/domains');
    };

    // Layout configuration
    const navItems = [
        {
            label: 'Dashboard',
            icon: <i className="fas fa-tachometer-alt" />,
            active: false,
            onClick: () => navigate('/admin-dashboard'),
        },
        {
            label: 'User Management',
            icon: <i className="fas fa-users-cog" />,
            active: false,
            onClick: () => navigate('/admin/users'),
        },
        {
            label: 'Domains',
            icon: <i className="fas fa-layer-group" />,
            active: true,
            onClick: () => navigate('/admin/domains'),
        },
    ];

    const logo = { icon: <i className="fas fa-graduation-cap" />, text: 'LMS Portal' };

    const footerUser = {
        name: user?.email?.split('@')[0] || 'Admin',
        email: user?.email || '',
    };

    useEffect(() => {
        setPageTitle('Topics Management');
        return () => setPageTitle('');
    }, [setPageTitle]);

    if (loading) return (
        <Layout title="Domain Details" navItems={navItems} logo={logo} footerUser={footerUser} onLogout={logout} backButton={{ label: 'Back to Domains', onClick: handleBack }}>
            <div className="loading-container"><div className="loading">Loading...</div></div>
        </Layout>
    );

    if (!domain) return (
        <Layout title="Domain Details" navItems={navItems} logo={logo} footerUser={footerUser} onLogout={logout} backButton={{ label: 'Back to Domains', onClick: handleBack }}>
            <div className="error-container"><div className="error-message">Domain not found</div></div>
        </Layout>
    );

    return (
        <Layout
            title={domain.name}
            navItems={navItems}
            logo={logo}
            footerUser={footerUser}
            onLogout={logout}
            backButton={{ label: 'Back to Domains', onClick: handleBack }}
        >
            <div className="course-view">
                {/* Success Message Banner */}
                {successMessage && (
                    <div className="alert-message success">
                        {successMessage}
                    </div>
                )}

                {/* Domain Header */}
                <div className="course-header">
                    <div className="d-flex justify-between align-center">
                        <div>
                            <h2>{domain.name}</h2>
                            <p>Domain Code: {domain.code} | {domain.duration_weeks ? `${domain.duration_weeks} Weeks` : domain.duration}</p>
                        </div>
                        <div className="header-right">
                            <button className="btn btn-primary" onClick={() => alert('Assign Trainee functionality to be implemented')}>
                                Assign Trainee
                            </button>
                        </div>
                    </div>
                    
                    <div className="course-meta-grid">
                        <div className="course-meta-item">
                            <div className="course-meta-label">Modules</div>
                            <div className="course-meta-value">{modules.length}</div>
                        </div>
                        <div className="course-meta-item">
                            <div className="course-meta-label">Students</div>
                            <div className="course-meta-value">{domain.students || '--'}</div>
                        </div>
                        <div className="course-meta-item">
                            <div className="course-meta-label">Duration</div>
                            <div className="course-meta-value">
                                {calculateTotalHours(domain.duration_weeks)} Hours
                            </div>
                        </div>
                        <div className="course-meta-item">
                            <div className="course-meta-label">Status</div>
                            <div className={`course-meta-value ${domain.is_active || domain.status === 'Active' ? 'status-active' : ''}`}>
                                {domain.is_active || domain.status === 'Active' ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        <div className="course-meta-item">
                            <div className="course-meta-label">Trainer</div>
                            <div className="course-meta-value">{domain.trainer || 'Not Assigned'}</div>
                        </div>
                    </div>
                </div>

                {/* Domain Description */}
                <div className="course-description">
                    <h3>Domain Description</h3>
                    <p>{domain.description}</p>
                </div>

                {/* Modules Section */}
                <div className="modules-section">
                    <div className="section-header">
                        <h3>Domain Modules</h3>
                        <button className="btn btn-primary" onClick={() => setShowModuleForm(true)}>
                            + Add New Module
                        </button>
                    </div>

                    {/* Add/Edit Module Form */}
                    {showModuleForm && (
                        <div className="card mb-3">
                            <div className="card-header">
                                <h4>{editingModule ? 'Edit Module' : 'Add New Module'}</h4>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <div className="form-group">
                                    <label>Module Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={newModule.title}
                                        onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="2" 
                                        value={newModule.description}
                                        onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Order Index</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={newModule.order_index}
                                        onChange={(e) => setNewModule({...newModule, order_index: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => editingModule ? handleUpdateModule(editingModule, newModule) : handleAddModule()}
                                    >
                                        {editingModule ? 'Update Module' : 'Add Module'}
                                    </button>
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => {
                                            setShowModuleForm(false);
                                            setEditingModule(null);
                                            setNewModule({ title: '', description: '', order_index: 0 });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Module List */}
                    <div className="module-list">
                        {modules.map((module, index) => (
                            <div key={module.id} className="module-card">
                                <div className="module-header" onClick={() => toggleModule(module.id)}>
                                    <div className="module-title">
                                        <div className="module-number">{index + 1}</div>
                                        <div>
                                            <div className="module-name">{module.title}</div>
                                            <div className="module-description">{module.description}</div>
                                        </div>
                                    </div>
                                    <div className="module-toggle">
                                        <span>{module.topics?.length || 0} Topics</span>
                                        <span className="toggle-icon">{expandedModules[module.id] ? '▲' : '▼'}</span>
                                    </div>
                                </div>
                                
                                {expandedModules[module.id] && (
                                    <div className="topics-list">
                                        {module.topics && module.topics.map((topic, topicIndex) => (
                                            <div key={topic.id} className="topic-item">
                                                <div className="topic-header">
                                                    <div className="topic-name">{topic.title}</div>
                                                    <span className="topic-order">Topic {topic.order_index || topicIndex + 1}</span>
                                                </div>
                                                <div className="topic-description">{topic.content || 'No description provided'}</div>
                                                {topic.resource_link && (
                                                    <div className="topic-resource">
                                                        <a href={topic.resource_link} target="_blank" rel="noopener noreferrer">Resource Link</a>
                                                    </div>
                                                )}
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn-outline btn-sm"
                                                        onClick={() => {
                                                            // Calls the popup modal function instead of inline form
                                                            startEditTopic(module.id, topic);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn-outline btn-sm btn-danger"
                                                        onClick={() => initiateDeleteTopic(module, topic)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Topic Form (Inline - Kept as is per standard UX for adding) */}
                                        {showTopicForm[module.id] && (
                                            <div className="topic-item">
                                                <div className="topic-header">
                                                    <div className="topic-name">Add New Topic</div>
                                                </div>
                                                <div style={{ padding: '1rem' }}>
                                                    <div className="form-group">
                                                        <label>Topic Title</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            value={newTopic.title}
                                                            onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Content</label>
                                                        <textarea 
                                                            className="form-control" 
                                                            rows="2" 
                                                            value={newTopic.content}
                                                            onChange={(e) => setNewTopic({...newTopic, content: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Resource Link (Optional)</label>
                                                        <input 
                                                            type="url" 
                                                            className="form-control" 
                                                            value={newTopic.resource_link}
                                                            onChange={(e) => setNewTopic({...newTopic, resource_link: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Order Index</label>
                                                        <input 
                                                            type="number" 
                                                            className="form-control" 
                                                            value={newTopic.order_index}
                                                            onChange={(e) => setNewTopic({...newTopic, order_index: parseInt(e.target.value) || 0})}
                                                        />
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button 
                                                            className="btn-outline btn-sm" 
                                                            onClick={() => handleAddTopic(module.id)}
                                                        >
                                                            Add Topic
                                                        </button>
                                                        <button 
                                                            className="btn-outline btn-sm" 
                                                            onClick={() => {
                                                                setShowTopicForm({});
                                                                setNewTopic({ title: '', content: '', resource_link: '', order_index: 0 });
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!showTopicForm[module.id] && (
                                            <div className="topic-item">
                                                <div className="topic-header">
                                                    <div className="topic-name">Add New Topic</div>
                                                </div>
                                                <div className="topic-description">Add a new topic to this module</div>
                                                <div className="action-buttons">
                                                    <button className="btn-outline btn-sm" onClick={() => openAddTopicForm(module.id)}>
                                                        + Add Topic
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="module-actions">
                                    <button 
                                        className="btn-outline btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditModule(module);
                                            setShowModuleForm(true);
                                        }}
                                    >
                                        Edit Module
                                    </button>
                                    <button 
                                        className="btn-outline btn-sm btn-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            initiateDeleteModule(module);
                                        }}
                                    >
                                        Delete Module
                                    </button>
                                </div>
                            </div>
                        ))}

                        {modules.length === 0 && (
                            <div className="no-modules">
                                <p>No modules added yet. Click "Add New Module" to get started.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Topic Modal (Task 1) */}
                {showEditModal && (
                    <div className="form-modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Edit Topic</h3>
                                <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Topic Title</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={newTopic.title}
                                        onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Content</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="4" 
                                        value={newTopic.content}
                                        onChange={(e) => setNewTopic({...newTopic, content: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Resource Link (Optional)</label>
                                    <input 
                                        type="url" 
                                        className="form-control" 
                                        value={newTopic.resource_link}
                                        onChange={(e) => setNewTopic({...newTopic, resource_link: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Order Index</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={newTopic.order_index}
                                        onChange={(e) => setNewTopic({...newTopic, order_index: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-primary" onClick={handleUpdateTopic}>
                                    Update Topic
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Delete Modal */}
                {showDeleteModal && (
                    <div className="delete-modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
                        <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Confirm Deletion</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="delete-warning">
                                    <h4>Delete {deleteTarget.type === 'module' ? 'Module' : 'Topic'}</h4>
                                    <p>
                                        Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? 
                                        {deleteTarget.type === 'module' 
                                            ? ' This will also delete all topics under it.' 
                                            : ''} 
                                        <br/>This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
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
            </div>
        </Layout>
    );
};

export default Topics;