import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Topics.css';

const Topics = () => {
  const { domainId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [domain, setDomain] = useState(null);
  const [modules, setModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState({});
  
  // Form states
  const [newModule, setNewModule] = useState({ 
    title: '', 
    description: '', 
    order_index: 0 
  });
  
  const [newTopic, setNewTopic] = useState({ 
    title: '', 
    type: 'video', 
    description: '', 
    duration: 0, 
    order_index: 0 
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';
  
  // Fetch domain details and modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In real app, you would fetch domain details
        // For now, use static domain data
        setDomain({
          id: domainId,
          name: 'Data Science Fundamentals',
          code: 'DS101',
          description: 'Master the basics of data science including Python programming, statistical analysis, machine learning concepts, and data visualization.',
          modules: 3,
          students: 245,
          hours: 45,
          status: 'Active',
          trainer: 'Dr. Sarah Johnson',
          duration: '12 Weeks'
        });
        
        // Fetch modules for this domain
        const response = await axios.get(`${API_BASE_URL}/modules/`, {
          params: { domain_id: domainId }
        });
        
        setModules(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [domainId]);
  
  // Fetch topics for a specific module
  const fetchTopics = async (moduleId) => {
    try {
      // Assuming you have a topics endpoint
      // For now, return mock data since endpoint not specified
      return [
        {
          id: '1',
          module_id: moduleId,
          title: 'Python Installation',
          type: 'video',
          description: 'Setting up Python environment',
          duration: 45,
          order_index: 1,
          status: 'Published'
        },
        {
          id: '2',
          module_id: moduleId,
          title: 'Python Syntax Basics',
          type: 'pdf',
          description: 'Variables, data types, and operators',
          duration: 60,
          order_index: 2,
          status: 'Published'
        }
      ];
    } catch (err) {
      console.error('Error fetching topics:', err);
      return [];
    }
  };
  
  // Toggle module expansion and fetch topics if needed
  const toggleModule = async (moduleId) => {
    const isExpanded = !expandedModules[moduleId];
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: isExpanded
    }));
    setShowTopicForm({});
    
    // If expanding and module doesn't have topics loaded yet, fetch them
    if (isExpanded) {
      const module = modules.find(m => m.id === moduleId);
      if (module && !module.topics) {
        const topics = await fetchTopics(moduleId);
        setModules(prev => prev.map(m => 
          m.id === moduleId ? { ...m, topics } : m
        ));
      }
    }
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
      
      // Add the new module to state
      setModules(prev => [...prev, response.data]);
      
      // Reset form
      setNewModule({ title: '', description: '', order_index: 0 });
      setShowModuleForm(false);
      
      // Update domain module count
      if (domain) {
        setDomain(prev => ({ ...prev, modules: prev.modules + 1 }));
      }
      
    } catch (err) {
      console.error('Error adding module:', err);
      alert(err.response?.data?.detail || 'Failed to add module');
    }
  };
  
  // Add new topic to a module
  const handleAddTopic = async (moduleId) => {
    if (!newTopic.title.trim()) {
      alert('Please enter topic title');
      return;
    }
    
    try {
      // Assuming you have a topics endpoint
      // Since the endpoint wasn't provided, we'll simulate it
      const newTopicObj = {
        id: Date.now().toString(),
        module_id: moduleId,
        ...newTopic,
        status: 'Published'
      };
      
      // Update the module with new topic
      setModules(prev => prev.map(module => {
        if (module.id === moduleId) {
          const updatedTopics = [...(module.topics || []), newTopicObj];
          return {
            ...module,
            topics: updatedTopics,
            topicsCount: updatedTopics.length
          };
        }
        return module;
      }));
      
      // Reset form
      setNewTopic({ 
        title: '', 
        type: 'video', 
        description: '', 
        duration: 0, 
        order_index: 0 
      });
      setShowTopicForm({});
      
    } catch (err) {
      console.error('Error adding topic:', err);
      alert('Failed to add topic');
    }
  };
  
  // Open topic form for a specific module
  const openTopicForm = (moduleId) => {
    setShowTopicForm({ [moduleId]: true });
  };
  
  // Delete a topic
  const deleteTopic = (moduleId, topicId) => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      setModules(prev => prev.map(module => {
        if (module.id === moduleId) {
          const updatedTopics = module.topics?.filter(topic => topic.id !== topicId) || [];
          return {
            ...module,
            topics: updatedTopics,
            topicsCount: updatedTopics.length
          };
        }
        return module;
      }));
    }
  };
  
  // Update a module
  const handleUpdateModule = async (moduleId, updatedData) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/modules/${moduleId}`,
        updatedData
      );
      
      // Update the module in state
      setModules(prev => prev.map(module => 
        module.id === moduleId ? response.data : module
      ));
      
    } catch (err) {
      console.error('Error updating module:', err);
      alert(err.response?.data?.detail || 'Failed to update module');
    }
  };
  
  const handleBack = () => {
    navigate('/admin/domains');
  };
  
  if (loading) return (
    <div className="loading-container">
      <div className="loading">Loading...</div>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
  
  if (!domain) return (
    <div className="error-container">
      <div className="error-message">Domain not found</div>
      <button className="btn btn-primary" onClick={handleBack}>
        Back to Domains
      </button>
    </div>
  );
  
  return (
    <div className="topics-management">
      {/* Back Button */}
      <button className="back-btn" onClick={handleBack}>
        ← Back to Domains
      </button>
      
      {/* Domain Header */}
      <div className="domain-header-detail">
        <div className="header-top">
          <div>
            <h2>{domain.name}</h2>
            <p className="domain-subtitle">Domain Code: {domain.code} | {domain.duration}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline-light">Edit Domain</button>
            <button className="btn btn-outline-light">Assign Trainer</button>
          </div>
        </div>
        
        <div className="domain-meta-grid">
          <div className="meta-item">
            <div className="meta-label">Modules</div>
            <div className="meta-value">{domain.modules}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Students</div>
            <div className="meta-value">{domain.students}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Duration</div>
            <div className="meta-value">{domain.hours}h</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Status</div>
            <div className="meta-value">{domain.status}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Trainer</div>
            <div className="meta-value">{domain.trainer}</div>
          </div>
        </div>
      </div>
      
      {/* Domain Description */}
      <div className="card description-card">
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
        
        {/* Add Module Form */}
        {showModuleForm && (
          <div className="card add-module-form">
            <div className="card-header">
              <h4>Add New Module</h4>
              <button className="close-btn" onClick={() => setShowModuleForm(false)}>×</button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Module Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter module title"
                  value={newModule.title}
                  onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Enter module description"
                  value={newModule.description}
                  onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Order Index</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={newModule.order_index}
                  onChange={(e) => setNewModule({...newModule, order_index: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleAddModule}>
                  Add Module
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModuleForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modules List */}
        <div className="modules-list">
          {modules.map((module) => (
            <div key={module.id} className="module-card">
              <div className="module-header" onClick={() => toggleModule(module.id)}>
                <div className="module-title">
                  <div className="module-number">{module.order_index}</div>
                  <div>
                    <div className="module-name">{module.title}</div>
                    <div className="module-description">{module.description}</div>
                  </div>
                </div>
                <div className="module-toggle">
                  <span>{(module.topics || []).length} Topics</span>
                  <span className="toggle-icon">
                    {expandedModules[module.id] ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              
              {/* Topics List (Shown when expanded) */}
              {expandedModules[module.id] && (
                <div className="topics-section">
                  <div className="topics-header">
                    <h4>Topics in {module.title}</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => openTopicForm(module.id)}>
                      + Add Topic
                    </button>
                  </div>
                  
                  {/* Add Topic Form */}
                  {showTopicForm[module.id] && (
                    <div className="card add-topic-form">
                      <div className="card-header">
                        <h5>Add New Topic</h5>
                        <button className="close-btn" onClick={() => setShowTopicForm({})}>×</button>
                      </div>
                      <div className="card-body">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Topic Title *</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter topic title"
                              value={newTopic.title}
                              onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Content Type</label>
                            <select
                              className="form-control"
                              value={newTopic.type}
                              onChange={(e) => setNewTopic({...newTopic, type: e.target.value})}
                            >
                              <option value="video">Video</option>
                              <option value="pdf">PDF</option>
                              <option value="quiz">Quiz</option>
                              <option value="assignment">Assignment</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Duration (minutes)</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="45"
                              value={newTopic.duration}
                              onChange={(e) => setNewTopic({...newTopic, duration: parseInt(e.target.value) || 0})}
                              min="0"
                            />
                          </div>
                          <div className="form-group">
                            <label>Order Index</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="1"
                              value={newTopic.order_index}
                              onChange={(e) => setNewTopic({...newTopic, order_index: parseInt(e.target.value) || 0})}
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Enter topic description"
                            value={newTopic.description}
                            onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn btn-primary" onClick={() => handleAddTopic(module.id)}>
                            Add Topic
                          </button>
                          <button className="btn btn-secondary" onClick={() => setShowTopicForm({})}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Topics List */}
                  <div className="topics-list">
                    {(module.topics || []).map((topic) => (
                      <div key={topic.id} className="topic-item">
                        <div className="topic-content">
                          <div className="topic-header">
                            <h5>{topic.title}</h5>
                            <span className={`topic-type ${topic.type.toLowerCase()}`}>
                              {topic.type}
                            </span>
                          </div>
                          <p className="topic-description">{topic.description}</p>
                          <div className="topic-meta">
                            <span>Duration: {topic.duration} min</span>
                            <span>Status: {topic.status}</span>
                            <span>Order: {topic.order_index}</span>
                          </div>
                        </div>
                        <div className="topic-actions">
                          <button className="btn btn-sm btn-secondary">Edit</button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteTopic(module.id, topic.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {(module.topics || []).length === 0 && !showTopicForm[module.id] && (
                      <div className="no-topics">
                        <p>No topics added yet. Click "Add Topic" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {modules.length === 0 && (
            <div className="no-modules">
              <p>No modules added yet. Click "Add New Module" to get started.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Domain Actions */}
      <div className="card domain-actions">
        <div className="card-header">
          <h3>Domain Actions</h3>
        </div>
        <div className="card-body">
          <div className="actions-grid">
            <button className="btn btn-primary">Assign Students</button>
            <button className="btn btn-outline">Edit Domain Details</button>
            <button className="btn btn-outline">View Student Progress</button>
            <button className="btn btn-outline btn-danger">Archive Domain</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topics;