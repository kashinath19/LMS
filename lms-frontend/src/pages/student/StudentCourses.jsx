import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ExternalLink, ChevronDown, ChevronUp, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import './StudentCourses.css';

const StudentCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModuleId, setExpandedModuleId] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const { setPageTitle } = useOutletContext();

    const API_BASE_URL = 'https://learning-management-system-a258.onrender.com';

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('access_token');

                if (!token) {
                    throw new Error("No authentication token found. Please log in.");
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                const [modulesRes, topicsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/modules/?limit=100`, { headers }),
                    fetch(`${API_BASE_URL}/api/v1/topics/?limit=1000`, { headers }) 
                ]);

                if (modulesRes.status === 401 || topicsRes.status === 401) {
                    throw new Error("Unauthorized: Your session may have expired. Please log in again.");
                }

                if (modulesRes.status === 404 || modulesRes.status === 204) {
                    setCourses([]);
                    setError(null);
                    setLoading(false);
                    return;
                }

                if (!modulesRes.ok) {
                    const errorText = await modulesRes.text();
                    if (errorText.includes('assigned') || errorText.includes('domain') || 
                        errorText.includes('no modules') || modulesRes.status === 400) {
                        setCourses([]);
                        setError(null);
                    } else {
                        throw new Error(`Modules API Error: ${modulesRes.statusText || 'Unable to load modules'}`);
                    }
                    setLoading(false);
                    return;
                }

                const modulesData = await modulesRes.json();
                const topicsData = topicsRes.ok ? await topicsRes.json() : [];

                if (!Array.isArray(modulesData) || modulesData.length === 0) {
                    setCourses([]);
                    setError(null);
                    setLoading(false);
                    return;
                }

                const organizedCourses = modulesData.map(module => {
                    const moduleTopics = Array.isArray(topicsData) 
                        ? topicsData
                            .filter(topic => topic.module_id === module.id)
                            .sort((a, b) => a.order_index - b.order_index)
                        : [];

                    return {
                        ...module,
                        topics: moduleTopics
                    };
                }).sort((a, b) => a.order_index - b.order_index);

                setCourses(organizedCourses);
                setError(null);
            } catch (err) {
                console.error("Error fetching courses:", err);
                if (err.message.includes("Unauthorized") || err.message.includes("log in")) {
                    setError(err.message);
                } else {
                    setError("An error occurred while loading your courses. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, []);

    useEffect(() => {
        setPageTitle('My Courses');
        return () => setPageTitle('');
    }, [setPageTitle]);

    const toggleModule = (id) => {
        setExpandedModuleId(expandedModuleId === id ? null : id);
    };

    const handleTopicClick = (topic) => {
        setSelectedTopic(topic);
    };

    if (loading) {
        return (
            <div className="sc-loading-container">
                <Loader2 className="sc-spinner" size={48} />
                <p>Loading your learning path...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sc-error-container">
                <AlertCircle size={48} />
                <p className="sc-error-message">{error}</p>
                {error.includes("log in") || error.includes("Unauthorized") ? (
                    <button onClick={() => window.location.href = '/login'} className="sc-retry-btn">
                        <LogIn size={16} style={{marginRight: '8px'}}/>
                        Go to Login
                    </button>
                ) : (
                    <button onClick={() => window.location.reload()} className="sc-retry-btn">
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="student-courses-page">
            {/* Page Header */}
            <div className="sc-header">
                <h1>My Courses</h1>
            </div>

            <div className="sc-container">
                {/* Left Panel - My Learning Modules */}
                <div className="sc-left-panel">
                    <div className="sc-modules-header">
                        <h2>My Learning Modules</h2>
                        <p>Track your progress and access content</p>
                    </div>
                    
                    {courses.length === 0 ? (
                        <div className="sc-empty-state">
                            <BookOpen size={64} />
                            <h3>No Modules Assigned Yet</h3>
                            <p>
                                You haven't been assigned to any domain modules yet. 
                                <br />
                                Please check back later or contact your administrator.
                            </p>
                            <div className="sc-empty-actions">
                                <button onClick={() => window.location.reload()}>
                                    Refresh Page
                                </button>
                                <button onClick={() => window.history.back()}>
                                    Go Back
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sc-modules-list">
                            {courses.map((module) => (
                                <div key={module.id} className={`sc-module-card ${expandedModuleId === module.id ? 'expanded' : ''}`}>
                                    <div 
                                        className="sc-module-header" 
                                        onClick={() => toggleModule(module.id)}
                                    >
                                        <div className="sc-module-info">
                                            <span className="sc-module-label">MODULE</span>
                                            <h3 className="sc-module-title">{module.title}</h3>
                                            <p className="sc-module-desc">{module.description}</p>
                                        </div>
                                        <div className="sc-module-toggle">
                                            {expandedModuleId === module.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {expandedModuleId === module.id && (
                                        <div className="sc-module-body">
                                            {module.topics && module.topics.length > 0 ? (
                                                <ul className="sc-topics-list">
                                                    {module.topics.map((topic) => (
                                                        <li 
                                                            key={topic.id} 
                                                            className={`sc-topic-item ${selectedTopic?.id === topic.id ? 'active' : ''}`}
                                                            onClick={() => handleTopicClick(topic)}
                                                        >
                                                            <div className="sc-topic-content">
                                                                <h4 className="sc-topic-title">{topic.title}</h4>
                                                                <p className="sc-topic-desc">{topic.content}</p>
                                                                {topic.resource_link && (
                                                                    <div className="sc-topic-badge">
                                                                        Resource Available
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="sc-no-topics">
                                                    <p>No topics available in this module yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel - Content Viewer */}
                <div className="sc-right-panel">
                    <div className="sc-content-viewer">
                        <div className="sc-viewer-header">
                            <h2>Content Viewer</h2>
                            {selectedTopic && (
                                <div className="sc-viewer-topic-title">{selectedTopic.title}</div>
                            )}
                        </div>

                        <div className="sc-viewer-content">
                            {selectedTopic ? (
                                <>
                                    {/* Resource Header */}
                                    <div className="sc-resource-header">
                                        <h3>{selectedTopic.title}</h3>
                                        {selectedTopic.resource_link && (
                                            <a 
                                                href={selectedTopic.resource_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="sc-external-link"
                                            >
                                                <ExternalLink size={16} />
                                                Open in New Tab
                                            </a>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="sc-content-area">
                                        {selectedTopic.resource_link ? (
                                            <div className="sc-resource-frame">
                                                {selectedTopic.resource_link.includes('.mp4') || 
                                                 selectedTopic.resource_link.includes('.webm') ||
                                                 selectedTopic.resource_link.includes('.avi') ||
                                                 selectedTopic.resource_link.includes('.mov') ? (
                                                    <video 
                                                        controls 
                                                        className="sc-video-player"
                                                        src={selectedTopic.resource_link}
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                ) : (
                                                    <iframe 
                                                        src={selectedTopic.resource_link}
                                                        title={selectedTopic.title}
                                                        className="sc-resource-iframe"
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="sc-text-content">
                                                <p>{selectedTopic.content || 'No content available'}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="sc-resource-description">
                                        <p>{selectedTopic.content || 'No description available'}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="sc-no-selection">
                                    <BookOpen size={64} />
                                    <h3>No Content Selected</h3>
                                    <p>Select a topic from the modules list to view its content here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentCourses;