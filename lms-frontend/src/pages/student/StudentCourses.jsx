import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, ExternalLink, ChevronDown, ChevronUp, 
  Loader2, AlertCircle, LogIn, Video, File, X, Play, 
  Download, Maximize2, Minimize2
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import './StudentCourses.css';

const StudentCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModuleId, setExpandedModuleId] = useState(null);
    const [activeResource, setActiveResource] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { setPageTitle } = useOutletContext();

    // FIX 1: Set Base URL to the root domain (without /api/v1 suffix to avoid duplication)
    const API_BASE_URL = 'https://learning-management-system-a258.onrender.com';

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setLoading(true);
                
                // FIX 2: Retrieve the token from localStorage
                const token = localStorage.getItem('access_token');

                if (!token) {
                    throw new Error("No authentication token found. Please log in.");
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                // Fetch Modules and Topics in parallel
                const [modulesRes, topicsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/modules/?limit=100`, { headers }),
                    fetch(`${API_BASE_URL}/api/v1/topics/?limit=1000`, { headers }) 
                ]);

                // Handle 401 specifically
                if (modulesRes.status === 401 || topicsRes.status === 401) {
                    throw new Error("Unauthorized: Your session may have expired. Please log in again.");
                }

                // Check if modules response is empty or has no content
                if (modulesRes.status === 404 || modulesRes.status === 204) {
                    // No modules assigned - this is not an error, just empty state
                    setCourses([]);
                    setError(null);
                    setLoading(false);
                    return;
                }

                if (!modulesRes.ok) {
                    // For other errors, check if it's specifically about domain assignment
                    const errorText = await modulesRes.text();
                    if (errorText.includes('assigned') || errorText.includes('domain') || 
                        errorText.includes('no modules') || modulesRes.status === 400) {
                        // Student is not assigned to any domain - this is not an error
                        setCourses([]);
                        setError(null);
                    } else {
                        throw new Error(`Modules API Error: ${modulesRes.statusText || 'Unable to load modules'}`);
                    }
                    setLoading(false);
                    return;
                }

                if (!topicsRes.ok) {
                    // Topics error is not critical for domain assignment check
                    console.warn("Topics API returned an error, but continuing with modules");
                }

                const modulesData = await modulesRes.json();
                const topicsData = topicsRes.ok ? await topicsRes.json() : [];

                // If modulesData is empty array, student has no modules
                if (!Array.isArray(modulesData) || modulesData.length === 0) {
                    setCourses([]);
                    setError(null);
                    setLoading(false);
                    return;
                }

                // Organize data: Add topics array to each module
                const organizedCourses = modulesData.map(module => {
                    const moduleTopics = Array.isArray(topicsData) 
                        ? topicsData
                            .filter(topic => topic.module_id === module.id)
                            .sort((a, b) => a.order_index - b.order_index) // Sort topics by order
                        : [];

                    return {
                        ...module,
                        topics: moduleTopics
                    };
                }).sort((a, b) => a.order_index - b.order_index); // Sort modules by order

                setCourses(organizedCourses);
                setError(null);
            } catch (err) {
                console.error("Error fetching courses:", err);
                // Only set error for actual errors, not for "no domain assigned"
                if (err.message.includes("Unauthorized") || err.message.includes("log in")) {
                    setError(err.message);
                } else {
                    // For other errors, show a generic message
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

    const openResource = (resourceUrl, topicTitle) => {
        // Determine resource type based on URL extension
        const url = resourceUrl.toLowerCase();
        let type = 'external';
        
        if (url.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/)) {
            type = 'video';
        } else if (url.match(/\.(pdf)$/)) {
            type = 'pdf';
        } else if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
            type = 'image';
        } else if (url.match(/\.(ppt|pptx|doc|docx|xls|xlsx)$/)) {
            type = 'document';
        }
        
        setActiveResource({
            url: resourceUrl,
            type: type,
            title: topicTitle
        });
    };

    const closeResource = () => {
        setActiveResource(null);
        setIsFullscreen(false);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const getResourceIcon = (url) => {
        const urlLower = url.toLowerCase();
        if (urlLower.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/)) {
            return <Video size={16} />;
        } else if (urlLower.match(/\.(pdf)$/)) {
            return <File size={16} />;
        } else if (urlLower.match(/\.(ppt|pptx|doc|docx|xls|xlsx)$/)) {
            return <FileText size={16} />;
        }
        return <ExternalLink size={16} />;
    };

    const getResourceTypeText = (url) => {
        const urlLower = url.toLowerCase();
        if (urlLower.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/)) {
            return 'Video';
        } else if (urlLower.match(/\.(pdf)$/)) {
            return 'PDF Document';
        } else if (urlLower.match(/\.(ppt|pptx)$/)) {
            return 'Presentation';
        } else if (urlLower.match(/\.(doc|docx)$/)) {
            return 'Document';
        } else if (urlLower.match(/\.(xls|xlsx)$/)) {
            return 'Spreadsheet';
        }
        return 'External Resource';
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
        // Show error state only for actual errors (like authentication issues)
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

    // Main content - show empty state or courses
    return (
        <div className={`student-courses-page ${activeResource ? 'resource-open' : ''}`}>
            <header className="sc-header">
                <div className="sc-header-content">
                    <h1>My Learning Modules</h1>
                    <p>Track your progress and access course materials</p>
                </div>
            </header>

            <div className="sc-content">
                {courses.length === 0 ? (
                    <div className="sc-empty-state">
                        <BookOpen size={64} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            No Modules Assigned Yet
                        </h3>
                        <p style={{ color: '#6b7280', maxWidth: '500px', lineHeight: '1.5' }}>
                            You haven't been assigned to any domain modules yet. 
                            <br />
                            Please check back later or contact your administrator for domain assignment.
                        </p>
                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => window.location.reload()} 
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#4338ca'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#4f46e5'}
                            >
                                Refresh Page
                            </button>
                            <button 
                                onClick={() => window.history.back()} 
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            >
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
                                        <span className="sc-module-label">Module</span>
                                        <h2 className="sc-module-title">{module.title}</h2>
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
                                                    <li key={topic.id} className="sc-topic-item">
                                                        <div className="sc-topic-icon">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="sc-topic-content">
                                                            <h4 className="sc-topic-title">{topic.title}</h4>
                                                            <p className="sc-topic-desc">{topic.content}</p>
                                                            {topic.resource_link && (
                                                                <div className="sc-topic-actions">
                                                                    <button 
                                                                        className="sc-view-resource-btn"
                                                                        onClick={() => openResource(topic.resource_link, topic.title)}
                                                                    >
                                                                        {getResourceIcon(topic.resource_link)}
                                                                        <span>View {getResourceTypeText(topic.resource_link)}</span>
                                                                        <Play size={14} />
                                                                    </button>
                                                                    <a 
                                                                        href={topic.resource_link} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="sc-download-resource"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <Download size={14} />
                                                                        <span>Download</span>
                                                                    </a>
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

            {/* Resource Display Panel */}
            {activeResource && (
                <div className={`sc-resource-display ${isFullscreen ? 'fullscreen' : ''}`}>
                    <div className="sc-resource-header">
                        <div className="sc-resource-title">
                            <h3>
                                {getResourceIcon(activeResource.url)}
                                <span>{activeResource.title}</span>
                            </h3>
                            <p className="sc-resource-type">{getResourceTypeText(activeResource.url)}</p>
                        </div>
                        <div className="sc-resource-controls">
                            <button 
                                className="sc-resource-btn secondary"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                            <a 
                                href={activeResource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="sc-resource-btn secondary"
                                title="Open in new tab"
                            >
                                <ExternalLink size={18} />
                            </a>
                            <a 
                                href={activeResource.url} 
                                download
                                className="sc-resource-btn secondary"
                                title="Download"
                            >
                                <Download size={18} />
                            </a>
                            <button 
                                className="sc-resource-btn close"
                                onClick={closeResource}
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="sc-resource-content">
                        {activeResource.type === 'video' ? (
                            <div className="sc-video-container">
                                <video 
                                    controls 
                                    autoPlay 
                                    className="sc-resource-video"
                                >
                                    <source src={activeResource.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="sc-video-info">
                                    <p>Video Resource: {activeResource.title}</p>
                                </div>
                            </div>
                        ) : activeResource.type === 'pdf' ? (
                            <div className="sc-pdf-container">
                                <iframe 
                                    src={activeResource.url} 
                                    title={activeResource.title}
                                    className="sc-resource-pdf"
                                />
                                <div className="sc-pdf-info">
                                    <p>PDF Document: {activeResource.title}</p>
                                </div>
                            </div>
                        ) : activeResource.type === 'image' ? (
                            <div className="sc-image-container">
                                <img 
                                    src={activeResource.url} 
                                    alt={activeResource.title}
                                    className="sc-resource-image"
                                />
                                <div className="sc-image-info">
                                    <p>Image: {activeResource.title}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="sc-external-container">
                                <div className="sc-external-content">
                                    <ExternalLink size={48} />
                                    <h4>External Resource</h4>
                                    <p>This resource will open in a new tab</p>
                                    <a 
                                        href={activeResource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="sc-external-link"
                                    >
                                        <span>Open {getResourceTypeText(activeResource.url)}</span>
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCourses;