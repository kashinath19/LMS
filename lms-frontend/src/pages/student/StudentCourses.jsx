import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ChevronDown, ChevronUp, Loader2, AlertCircle, LogIn, File, Image, Film, Presentation, FileText as DocIcon, Sheet, Globe, ExternalLink, AlertTriangle } from 'lucide-react';
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

    // Function to extract Google Drive file ID
    const getGoogleDriveFileId = (url) => {
        // Handle different Google Drive URL formats
        const patterns = [
            /drive\.google\.com\/file\/d\/([^\/]+)/,
            /drive\.google\.com\/open\?id=([^&]+)/,
            /drive\.google\.com\/uc\?id=([^&]+)/,
            /docs\.google\.com\/(?:presentation|document|spreadsheets)\/d\/([^\/]+)/,
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    };

    // Function to check if URL is from Google Docs/Sheets/Slides
    const isGoogleWorkspaceUrl = (url) => {
        return url.includes('docs.google.com') && 
               (url.includes('/presentation/') || 
                url.includes('/document/') || 
                url.includes('/spreadsheets/'));
    };

    // Function to check if URL is a direct file link
    const isDirectFileLink = (url) => {
        const directFilePatterns = [
            /\.(pdf|ppt|pptx|doc|docx|xls|xlsx|txt|rtf|jpg|jpeg|png|gif|bmp|svg|webp|mp4|webm|avi|mov|wmv|flv|mkv)$/i,
        ];
        return directFilePatterns.some(pattern => pattern.test(url));
    };

    // Function to get file extension
    const getFileExtension = (url) => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const extension = pathname.split('.').pop().toLowerCase();
            
            // Clean extension from query parameters
            const cleanExtension = extension.split('?')[0];
            return cleanExtension;
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
        
        // Check for Google Drive
        if (url.includes('drive.google.com')) {
            const fileId = getGoogleDriveFileId(url);
            if (fileId) {
                // Try to determine type from URL patterns
                if (url.includes('/presentation/') || url.includes('/open?id=') && url.includes('presentation')) {
                    return 'google-presentation';
                } else if (url.includes('/document/') || url.includes('/open?id=') && url.includes('document')) {
                    return 'google-document';
                } else if (url.includes('/spreadsheets/') || url.includes('/open?id=') && url.includes('spreadsheet')) {
                    return 'google-spreadsheet';
                } else if (url.includes('/file/d/')) {
                    // Generic Google Drive file - we'll try to determine by extension
                    return 'google-drive-file';
                }
            }
            return 'google-drive';
        }
        
        // Check for Google Workspace (Docs, Sheets, Slides)
        if (isGoogleWorkspaceUrl(url)) {
            if (url.includes('/presentation/')) {
                return 'google-presentation';
            } else if (url.includes('/document/')) {
                return 'google-document';
            } else if (url.includes('/spreadsheets/')) {
                return 'google-spreadsheet';
            }
        }
        
        // Check for Microsoft Office files
        if (url.includes('office.com') || url.includes('live.com') || url.includes('sharepoint.com')) {
            if (url.includes('.ppt') || url.includes('.pptx') || url.includes('PowerPoint')) {
                return 'microsoft-presentation';
            } else if (url.includes('.doc') || url.includes('.docx') || url.includes('Word')) {
                return 'microsoft-document';
            } else if (url.includes('.xls') || url.includes('.xlsx') || url.includes('Excel')) {
                return 'microsoft-spreadsheet';
            }
        }
        
        // Check for direct file links with extensions
        if (isDirectFileLink(url)) {
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
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff'];
            if (imageExtensions.includes(extension)) {
                return 'image';
            }
            
            // Document formats
            const docExtensions = ['doc', 'docx', 'txt', 'rtf', 'odt'];
            if (docExtensions.includes(extension)) {
                return 'document';
            }
            
            // PowerPoint formats
            const pptExtensions = ['ppt', 'pptx', 'pps', 'ppsx', 'odp'];
            if (pptExtensions.includes(extension)) {
                return 'presentation';
            }
            
            // Excel formats
            const excelExtensions = ['xls', 'xlsx', 'csv', 'ods'];
            if (excelExtensions.includes(extension)) {
                return 'spreadsheet';
            }
        }
        
        // Default to iframe for web pages
        return 'webpage';
    };

    // Function to get proper embed URL for different services
    const getEmbedUrl = (url, resourceType) => {
        switch (resourceType) {
            case 'youtube': {
                const videoId = getYouTubeVideoId(url);
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
            }

            case 'vimeo': {
                const vimeoId = url.split('/').pop();
                return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
            }

            case 'google-drive':
            case 'google-drive-file': {
                const fileId = getGoogleDriveFileId(url);
                return `https://drive.google.com/file/d/${fileId}/preview`;
            }

            case 'google-presentation':
            case 'google-document':
            case 'google-spreadsheet': {
                // Convert to embed-friendly URL
                const fileId = getGoogleDriveFileId(url);
                let embedUrl = url.replace('/edit', '/preview');
                if (embedUrl.includes('/presentation/')) {
                    embedUrl = embedUrl.replace('/pub', '').replace('/pubhtml', '') + '?rm=minimal';
                } else if (embedUrl.includes('/document/')) {
                    embedUrl = embedUrl + '?rm=minimal';
                } else if (embedUrl.includes('/spreadsheets/')) {
                    embedUrl = embedUrl + '?rm=minimal&single=true&widget=false&headers=false';
                }
                return embedUrl;
            }

            case 'microsoft-presentation':
            case 'microsoft-document':
            case 'microsoft-spreadsheet': {
                // Use Microsoft Office Online Viewer
                return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
            }

            case 'presentation':
            case 'document':
            case 'spreadsheet': {
                // Use Microsoft Office Online Viewer for direct file links
                return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
            }

            case 'pdf': {
                // For PDFs, use Google Docs viewer for better compatibility
                return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
            }

            default:
                return url;
        }
    };

    // Function to get display name for resource type
    const getResourceTypeName = (resourceType) => {
        const typeNames = {
            'youtube': 'YOUTUBE',
            'vimeo': 'VIDEO',
            'video': 'VIDEO',
            'pdf': 'PDF',
            'image': 'IMAGE',
            'document': 'DOCUMENT',
            'presentation': 'PRESENTATION',
            'spreadsheet': 'SPREADSHEET',
            'google-drive': 'GOOGLE DRIVE',
            'google-drive-file': 'GOOGLE DRIVE FILE',
            'google-document': 'GOOGLE DOC',
            'google-presentation': 'GOOGLE SLIDES',
            'google-spreadsheet': 'GOOGLE SHEETS',
            'microsoft-document': 'WORD DOCUMENT',
            'microsoft-presentation': 'POWERPOINT',
            'microsoft-spreadsheet': 'EXCEL',
            'webpage': 'WEBPAGE',
            'unknown': 'RESOURCE'
        };
        return typeNames[resourceType] || 'RESOURCE';
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
        const embedUrl = getEmbedUrl(topic.resource_link, resourceType);

        // Common iframe attributes
        const iframeAttributes = {
            title: topic.title,
            className: `sc-iframe-${resourceType}`,
            frameBorder: "0",
            allowFullScreen: true,
            sandbox: "allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
        };

        switch (resourceType) {
            case 'youtube':
            case 'vimeo':
                return (
                    <div className={`sc-${resourceType}-player`}>
                        <iframe
                            {...iframeAttributes}
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    </div>
                );

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
            case 'image':
            case 'document':
            case 'presentation':
            case 'spreadsheet':
            case 'google-drive':
            case 'google-drive-file':
            case 'google-document':
            case 'google-presentation':
            case 'google-spreadsheet':
            case 'microsoft-document':
            case 'microsoft-presentation':
            case 'microsoft-spreadsheet':
            case 'webpage':
                return (
                    <div className={`sc-${resourceType}-viewer`}>
                        <iframe
                            {...iframeAttributes}
                            src={embedUrl}
                        />
                        {resourceType === 'image' && (
                            <div className="sc-image-fallback">
                                <img
                                    src={topic.resource_link}
                                    alt={topic.title}
                                    className="sc-image-display"
                                />
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="sc-webpage-viewer">
                        <iframe
                            {...iframeAttributes}
                            src={embedUrl}
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
            case 'google-document':
            case 'microsoft-document':
                return <DocIcon size={16} />;
            case 'presentation':
            case 'google-presentation':
            case 'microsoft-presentation':
                return <Presentation size={16} />;
            case 'spreadsheet':
            case 'google-spreadsheet':
            case 'microsoft-spreadsheet':
                return <Sheet size={16} />;
            case 'google-drive':
            case 'google-drive-file':
                return <File size={16} />;
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
        <div className="sc-courses-container">
            <div className="sc-main-container">
                {/* Left Panel - My Learning Modules */}
                <div className="sc-left-panel">
                    <div className="sc-modules-header">
                        <h2>My Learning Modules</h2>
                        <p>Track your progress and manage course content</p>
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
                                <div key={module.id} className={`sc-module-card ${expandedModuleId === module.id ? 'sc-module-card-expanded' : ''}`}>
                                    <div 
                                        className="sc-module-header" 
                                        onClick={() => toggleModule(module.id)}
                                    >
                                        <div className="sc-module-info">
                                            <h3 className="sc-module-title">{module.title}</h3>
                                            <p className="sc-module-description">{module.description}</p>
                                        </div>
                                        <div className="sc-module-toggle">
                                            {expandedModuleId === module.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {expandedModuleId === module.id && (
                                        <div className="sc-module-card-content">
                                            {/* Progress Bar */}
                                            <div className="sc-progress-container">
                                                <div className="sc-progress-label">
                                                    <span>Progress</span>
                                                    <span className="sc-progress-percent">0%</span>
                                                </div>
                                                <div className="sc-progress-bar">
                                                    <div className="sc-progress-fill" style={{ width: '0%' }}></div>
                                                </div>
                                            </div>

                                            {/* Topics Section */}
                                            <div className="sc-topics-section">
                                                {module.topics && module.topics.length > 0 ? (
                                                    <div className="sc-topics-list">
                                                        {module.topics.map((topic, index) => (
                                                            <div 
                                                                key={topic.id} 
                                                                className={`sc-topic-card ${selectedTopic?.id === topic.id ? 'sc-topic-card-active' : ''}`}
                                                                onClick={() => handleTopicClick(topic)}
                                                            >
                                                                <div className="sc-topic-card-content">
                                                                    <div className="sc-topic-icon">
                                                                        {getResourceIcon(topic.resource_link)}
                                                                    </div>
                                                                    <div className="sc-topic-info">
                                                                        <div className="sc-topic-badge">{index + 1}</div>
                                                                        <h4 className="sc-topic-title">{topic.title}</h4>
                                                                        <p className="sc-topic-description">{topic.content}</p>
                                                                        {topic.resource_link && (
                                                                            <div className="sc-resource-tag">
                                                                                {getResourceTypeName(getResourceType(topic.resource_link))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="sc-no-topics">
                                                        <p>No topics available in this module yet.</p>
                                                    </div>
                                                )}
                                            </div>
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
                            <div className="sc-viewer-header-top">
                                <h2>Content Viewer</h2>
                                {selectedTopic && (
                                    <span className="sc-module-badge">
                                        {courses.find(m => m.topics?.some(t => t.id === selectedTopic.id))?.title || 'Module'}
                                    </span>
                                )}
                            </div>
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
                                        <h3>Topic Details</h3>
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