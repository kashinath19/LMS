import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Domain.css';

const Domain = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', code: '', description: '' });
  const [domains] = useState([
    {
      id: 'ds101',
      code: 'DS101',
      name: 'Data Science Fundamentals',
      status: 'Active',
      weeks: '12 Weeks',
      description: 'Master the basics of data science including Python, statistics, and machine learning.',
      modules: 4,
      students: 245,
      hours: 45,
      trainer: 'Dr. Sarah Johnson',
      color: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
    },
    {
      id: 'fs201',
      code: 'FS201',
      name: 'Full Stack Development',
      status: 'Active',
      weeks: '16 Weeks',
      description: 'Learn to build modern web applications with React, Node.js, and databases.',
      modules: 5,
      students: 189,
      hours: 60,
      trainer: 'John Smith',
      color: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
    },
    {
      id: 'bi301',
      code: 'BI301',
      name: 'Business Intelligence',
      status: 'Upcoming',
      weeks: '10 Weeks',
      description: 'Data visualization and analytics for business decision making.',
      modules: 3,
      students: 54,
      hours: 30,
      trainer: 'Lisa Wang',
      color: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
    }
  ]);

  const handleViewDomain = (domainId) => {
    navigate(`/admin/domains/${domainId}/topics`);
  };

  const handleAddDomain = () => {
    if (newDomain.name && newDomain.code) {
      alert(`Domain "${newDomain.name}" added successfully!`);
      setNewDomain({ name: '', code: '', description: '' });
      setShowForm(false);
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <div className="domain-management">
      {/* Header */}
      <div className="domain-header">
        <div className="header-left">
          <h1>Domains Management</h1>
          <p>Manage and organize all learning domains</p>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            + Add New Domain
          </button>
        </div>
      </div>

      {/* Add Domain Form */}
      {showForm && (
        <div className="card add-domain-form">
          <div className="card-header">
            <h3>Add New Domain</h3>
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="domainName">Domain Name</label>
                <input
                  type="text"
                  id="domainName"
                  className="form-control"
                  placeholder="Enter domain name"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="domainCode">Domain Code</label>
                <input
                  type="text"
                  id="domainCode"
                  className="form-control"
                  placeholder="e.g., DS101"
                  value={newDomain.code}
                  onChange={(e) => setNewDomain({...newDomain, code: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="domainDescription">Description</label>
              <textarea
                id="domainDescription"
                className="form-control"
                rows="3"
                placeholder="Enter domain description"
                value={newDomain.description}
                onChange={(e) => setNewDomain({...newDomain, description: e.target.value})}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddDomain}>
                Create Domain
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domains Grid */}
      <div className="domains-grid">
        {domains.map((domain) => (
          <div 
            key={domain.id}
            className="domain-card"
            onClick={() => handleViewDomain(domain.id)}
          >
            <div className="domain-image" style={{ background: domain.color }}>
              <div className="domain-code">{domain.code}</div>
            </div>
            <div className="domain-content">
              <div className="domain-meta">
                <span className={`badge ${domain.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                  {domain.status}
                </span>
                <span>{domain.weeks}</span>
              </div>
              <h4>{domain.name}</h4>
              <p className="domain-description">{domain.description}</p>
              
              <div className="domain-stats">
                <div className="stat-item">
                  <div className="stat-number">{domain.modules}</div>
                  <div className="stat-label">Modules</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{domain.students}</div>
                  <div className="stat-label">Students</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{domain.hours}</div>
                  <div className="stat-label">Hours</div>
                </div>
              </div>
              
              <div className="domain-footer">
                <span className="trainer-name">Trainer: {domain.trainer}</span>
                <span className="view-domain">View Topics →</span>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Domain Card */}
        <div className="domain-card add-domain-card" onClick={() => setShowForm(true)}>
          <div className="domain-image add-domain-image">
            <div className="add-icon">+</div>
          </div>
          <div className="domain-content">
            <h4>Add New Domain</h4>
            <p>Create a new learning domain with modules and topics</p>
            <button className="btn btn-outline">
              + Create Domain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Domain;