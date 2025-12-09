import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Topics.css';

const Topics = () => {
  const { domainId } = useParams();
  const navigate = useNavigate();
  const [domain, setDomain] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState({});
  const [newModule, setNewModule] = useState({ name: '', description: '' });
  const [newTopic, setNewTopic] = useState({ 
    name: '', 
    type: 'video', 
    description: '', 
    duration: '', 
    order: '' 
  });

  // Sample domains data
  const domainsData = {
    ds101: {
      id: 'ds101',
      name: 'Data Science Fundamentals',
      code: 'DS101',
      duration: '12 Weeks',
      description: 'Master the basics of data science including Python programming, statistical analysis, machine learning concepts, and data visualization.',
      modules: 4,
      students: 245,
      hours: 45,
      status: 'Active',
      trainer: 'Dr. Sarah Johnson',
      modulesList: [
        {
          id: 'module1',
          number: 1,
          name: 'Python Programming',
          description: 'Learn Python from basics to advanced concepts for data science',
          topicsCount: 4,
          topics: [
            {
              id: '1.1',
              name: 'Python Installation',
              type: 'Video',
              description: 'Setting up Python environment',
              duration: '45 min',
              status: 'Published',
              order: 1
            },
            {
              id: '1.2',
              name: 'Python Syntax Basics',
              type: 'PDF',
              description: 'Variables, data types, and operators',
              duration: '60 min',
              status: 'Published',
              order: 2
            },
            {
              id: '1.3',
              name: 'Control Structures',
              type: 'Video',
              description: 'If statements and loops in Python',
              duration: '75 min',
              status: 'Published',
              order: 3
            }
          ]
        },
        {
          id: 'module2',
          number: 2,
          name: 'Statistics Fundamentals',
          description: 'Basic statistical concepts for data analysis',
          topicsCount: 6,
          topics: [
            {
              id: '2.1',
              name: 'Descriptive Statistics',
              type: 'Video',
              description: 'Mean, median, mode, and variance',
              duration: '50 min',
              status: 'Published',
              order: 1
            },
            {
              id: '2.2',
              name: 'Probability Distributions',
              type: 'PDF',
              description: 'Normal, binomial, and Poisson distributions',
              duration: '65 min',
              status: 'Published',
              order: 2
            }
          ]
        },
        {
          id: 'module3',
          number: 3,
          name: 'Machine Learning Basics',
          description: 'Introduction to ML algorithms and concepts',
          topicsCount: 8,
          topics: [
            {
              id: '3.1',
              name: 'Linear Regression',
              type: 'Video',
              description: 'Understanding linear regression models',
              duration: '55 min',
              status: 'Published',
              order: 1
            }
          ]
        }
      ]
    }
  };

  useEffect(() => {
    if (domainsData[domainId]) {
      setDomain(domainsData[domainId]);
    } else {
      navigate('/admin/domains');
    }
  }, [domainId, navigate]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
    setShowTopicForm({});
  };

  const handleAddModule = () => {
    if (newModule.name) {
      const newModuleObj = {
        id: `module${Date.now()}`,
        number: domain.modulesList.length + 1,
        name: newModule.name,
        description: newModule.description,
        topicsCount: 0,
        topics: []
      };
      
      setDomain(prev => ({
        ...prev,
        modulesList: [...prev.modulesList, newModuleObj],
        modules: prev.modules + 1
      }));
      
      setNewModule({ name: '', description: '' });
      setShowModuleForm(false);
    }
  };

  const handleAddTopic = (moduleId) => {
    if (newTopic.name) {
      setDomain(prev => ({
        ...prev,
        modulesList: prev.modulesList.map(module => {
          if (module.id === moduleId) {
            const newTopicObj = {
              id: `${module.number}.${module.topics.length + 1}`,
              ...newTopic,
              status: 'Published'
            };
            return {
              ...module,
              topics: [...module.topics, newTopicObj],
              topicsCount: module.topics.length + 1
            };
          }
          return module;
        })
      }));
      
      setNewTopic({ 
        name: '', 
        type: 'video', 
        description: '', 
        duration: '', 
        order: '' 
      });
      setShowTopicForm({});
    }
  };

  const openTopicForm = (moduleId) => {
    setShowTopicForm({ [moduleId]: true });
  };

  const deleteTopic = (moduleId, topicId) => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      setDomain(prev => ({
        ...prev,
        modulesList: prev.modulesList.map(module => {
          if (module.id === moduleId) {
            const updatedTopics = module.topics.filter(topic => topic.id !== topicId);
            return {
              ...module,
              topics: updatedTopics,
              topicsCount: updatedTopics.length
            };
          }
          return module;
        })
      }));
    }
  };

  const handleBack = () => {
    navigate('/admin/domains');
  };

  if (!domain) return <div className="loading">Loading...</div>;

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
                <label>Module Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter module name"
                  value={newModule.name}
                  onChange={(e) => setNewModule({...newModule, name: e.target.value})}
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
          {domain.modulesList.map((module) => (
            <div key={module.id} className="module-card">
              <div className="module-header" onClick={() => toggleModule(module.id)}>
                <div className="module-title">
                  <div className="module-number">{module.number}</div>
                  <div>
                    <div className="module-name">{module.name}</div>
                    <div className="module-description">{module.description}</div>
                  </div>
                </div>
                <div className="module-toggle">
                  <span>{module.topicsCount} Topics</span>
                  <span className="toggle-icon">
                    {expandedModules[module.id] ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Topics List (Shown when expanded) */}
              {expandedModules[module.id] && (
                <div className="topics-section">
                  <div className="topics-header">
                    <h4>Topics in {module.name}</h4>
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
                            <label>Topic Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter topic name"
                              value={newTopic.name}
                              onChange={(e) => setNewTopic({...newTopic, name: e.target.value})}
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
                              onChange={(e) => setNewTopic({...newTopic, duration: e.target.value})}
                            />
                          </div>
                          <div className="form-group">
                            <label>Display Order</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="1"
                              value={newTopic.order}
                              onChange={(e) => setNewTopic({...newTopic, order: e.target.value})}
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
                    {module.topics.map((topic) => (
                      <div key={topic.id} className="topic-item">
                        <div className="topic-content">
                          <div className="topic-header">
                            <h5>{topic.name}</h5>
                            <span className={`topic-type ${topic.type.toLowerCase()}`}>
                              {topic.type}
                            </span>
                          </div>
                          <p className="topic-description">{topic.description}</p>
                          <div className="topic-meta">
                            <span>Duration: {topic.duration}</span>
                            <span>Status: {topic.status}</span>
                            <span>Order: {topic.order}</span>
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
                    
                    {module.topics.length === 0 && !showTopicForm[module.id] && (
                      <div className="no-topics">
                        <p>No topics added yet. Click "Add Topic" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
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