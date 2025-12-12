import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ChevronDown, ChevronUp, Loader2, AlertCircle, LogIn, File, Image, Film, FileText as DocIcon } from 'lucide-react';
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

    // Function to extract YouTube video ID from URL
    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Function to get file extension
    const getFileExtension = (url) => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const extension = pathname.split('.').pop().toLowerCase();
            return extension;
        } catch (error) {
            // If URL parsing fails, try to extract extension from string
            const parts = url.split('.').pop().toLowerCase();
            const cleanPart = parts.split('?')[0]; // Remove query parameters
            return cleanPart;
        }
    };

    // Function to determine resource type
    const getResourceType = (url) => {
        if (!url) return 'unknown';

        // Check for YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        }

        // Check for Vimeo
        if (url.includes('vimeo.com')) {
            return 'vimeo';
        }

        const extension = getFileExtension(url);

        // Video formats
        const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp'];
        if (videoExtensions.includes(extension)) {
            return 'video';
        }

        // PDF
        if (extension === 'pdf') {
            return 'pdf';
        }

        // Image formats
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        if (imageExtensions.includes(extension)) {
            return 'image';
        }

        // Document formats
        const docExtensions = ['doc', 'docx', 'txt', 'rtf'];
        if (docExtensions.includes(extension)) {
            return 'document';
        }

        // PowerPoint formats
        const pptExtensions = ['ppt', 'pptx', 'pps', 'ppsx'];
        if (pptExtensions.includes(extension)) {
            return 'powerpoint';
        }

        // Excel formats
        const excelExtensions = ['xls', 'xlsx', 'csv'];
        if (excelExtensions.includes(extension)) {
            return 'excel';
        }

        // Default to iframe for web pages
        return 'webpage';
    };

    // Function to get Google Docs embed URL for documents
    const getGoogleDocsEmbedUrl = (url) => {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    };

    // Function to get Office 365 embed URL
    const getOfficeEmbedUrl = (url) => {
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    };

    const renderResourceContent = (topic) => {
        if (!topic.resource_link) {
            return (
                <div className="sc-text-content">
                    <p>{topic.content || 'No content available'}</p>
                </div>
            );
        }

        const resourceType = getResourceType(topic.resource_link);

        switch (resourceType) {
            case 'youtube': {
                const videoId = getYouTubeVideoId(topic.resource_link);
                return (
                    <div className="sc-youtube-player">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                            title={topic.title}
                            className="sc-youtube-iframe"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }

            case 'vimeo': {
                const vimeoId = topic.resource_link.split('/').pop();
                return (
                    <div className="sc-vimeo-player">
                        <iframe
                            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                            title={topic.title}
                            className="sc-vimeo-iframe"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }

            case 'video':
                return (
                    <div className="sc-video-player-container">
                        <video
                            controls
                            autoPlay
                            className="sc-video-player"
                            src={topic.resource_link}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            case 'pdf':
                return (
                    <div className="sc-pdf-viewer">
                        <iframe
                            src={topic.resource_link}
                            title={topic.title}
                            className="sc-pdf-iframe"
                        />
                    </div>
                );

            case 'image':
                return (
                    <div className="sc-image-viewer">
                        <img
                            src={topic.resource_link}
                            alt={topic.title}
                            className="sc-image-display"
                        />
                    </div>
                );

            case 'document':
                return (
                    <div className="sc-document-viewer">
                        <iframe
                            src={getGoogleDocsEmbedUrl(topic.resource_link)}
                            title={topic.title}
                            className="sc-document-iframe"
                        />
                    </div>
                );

            case 'powerpoint':
            case 'excel':
                return (
                    <div className="sc-office-viewer">
                        <iframe
                            src={getOfficeEmbedUrl(topic.resource_link)}
                            title={topic.title}
                            className="sc-office-iframe"
                        />
                    </div>
                );

            case 'webpage':
            default:
                return (
                    <div className="sc-webpage-viewer">
                        <iframe
                            src={topic.resource_link}
                            title={topic.title}
                            className="sc-webpage-iframe"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                    </div>
                );
        }
    };

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

    // Function to get icon for resource type
    const getResourceIcon = (resourceLink) => {
        if (!resourceLink) return <FileText size={16} />;

        const type = getResourceType(resourceLink);
        switch (type) {
            case 'youtube':
            case 'video':
            case 'vimeo':
                return <Film size={16} />;
            case 'pdf':
                return <File size={16} />;
            case 'image':
                return <Image size={16} />;
            case 'document':
            case 'powerpoint':
            case 'excel':
                return <DocIcon size={16} />;
            default:
                return <FileText size={16} />;
        }
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
                        <LogIn size={16} style={{ marginRight: '8px' }} />
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
                                                            <div className="sc-topic-icon">
                                                                {getResourceIcon(topic.resource_link)}
                                                            </div>
                                                            <div className="sc-topic-content">
                                                                <h4 className="sc-topic-title">{topic.title}</h4>
                                                                <p className="sc-topic-desc">{topic.content}</p>
                                                                {topic.resource_link && (
                                                                    <div className="sc-topic-badge">
                                                                        {getResourceType(topic.resource_link).toUpperCase()} Available
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
                                    {/* Content Area */}
                                    <div className="sc-content-area">
                                        {renderResourceContent(selectedTopic)}
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