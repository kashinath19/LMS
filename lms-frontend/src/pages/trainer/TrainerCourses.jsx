import React, { useState, useEffect, useContext } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  FileText,
  ExternalLink,
  AlertCircle,
  BookOpen,
  File,
  Film,
  Image as ImageIcon,
  Music,
  Loader2,
  Download,
  ShieldAlert
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import styles from './TrainerCourses.module.css';

// Hostnames known for showing ad overlays or refusing embeds
const HOST_DENYLIST = [
    'in.docs.wps.com',
    'preview.wps.com',
    'wps.com',
    'view.officeapps.live.com', // Sometimes better to force download if embed fails
];

const TrainerCourses = () => {
    const { user } = useContext(AuthContext);
    const { setPageTitle } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    const [moduleTopics, setModuleTopics] = useState({});
    const [loadingTopics, setLoadingTopics] = useState({});
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    
    // Progress tracking: { moduleId: { topicId: true/false } }
    const [topicProgress, setTopicProgress] = useState({});

    // ============================================================
    // RESOURCE DETECTION & SECURITY HELPER FUNCTIONS
    // ============================================================

    /**
     * Check if a URL belongs to a denylisted host
     */
    const isHostDenylisted = (url) => {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            return HOST_DENYLIST.some(blocked => hostname.includes(blocked));
        } catch (e) {
            return false;
        }
    };

    /**
     * Extract Google Drive file ID from various Google Drive URL formats
     */
    const extractGoogleDriveId = (url) => {
        try {
            const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
            if (fileIdMatch) return fileIdMatch[1];
            
            const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
            if (openIdMatch) return openIdMatch[1];
            
            return null;
        } catch (error) {
            return null;
        }
    };

    /**
     * Convert Google Drive URL to embeddable format
     */
    const getGoogleDriveEmbedUrl = (url) => {
        const driveId = extractGoogleDriveId(url);
        if (driveId) {
            // Use Google Docs Viewer for universal embedding
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
            return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(downloadUrl)}`;
        }
        return null;
    };

    /**
     * Helper to get clean file extension
     */
    const getFileExtension = (url) => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const extension = pathname.split('.').pop().toLowerCase();
            return extension;
        } catch (error) {
            const parts = url.split('.').pop().toLowerCase();
            const cleanPart = parts.split('?')[0];
            return cleanPart;
        }
    };

    /**
     * Universal resource type detection
     * STRICT MODE: Separates 'audio' and 'blocked' types
     */
    const detectResourceType = (url) => {
        if (!url) return 'text';

        // 1. Check Denylist first
        if (isHostDenylisted(url)) return 'blocked';

        const lower = url.toLowerCase();

        // 2. Video platforms
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
        if (lower.includes('vimeo.com')) return 'vimeo';

        // 3. Google Drive
        if (lower.includes('drive.google.com')) return 'gdrive';

        // 4. File extensions
        const extension = getFileExtension(url);
        
        // Audio (Explicitly detected to block embedding)
        const audioExtensions = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac', 'wma'];
        if (audioExtensions.includes(extension)) return 'audio';

        // PDF
        if (extension === 'pdf') return 'pdf';
        
        // PowerPoint
        if (extension === 'ppt' || extension === 'pptx' || extension === 'pps' || extension === 'ppsx') {
            return 'powerpoint';
        }
        
        // Word documents
        if (extension === 'doc' || extension === 'docx' || extension === 'txt' || extension === 'rtf') {
            return 'document';
        }
        
        // Excel
        if (extension === 'xls' || extension === 'xlsx' || extension === 'csv') {
            return 'excel';
        }
        
        // Videos
        const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp'];
        if (videoExtensions.includes(extension)) return 'video';
        
        // Images
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        if (imageExtensions.includes(extension)) return 'image';

        // Default
        return 'webpage';
    };

    // Helper to get YouTube ID
    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    /**
     * Get universal Google Docs Viewer URL for PDFs and office documents
     */
    const getGoogleViewerEmbedUrl = (url) => {
        return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
    };

    /**
     * Get Icon for list view
     */
    const getResourceIcon = (resourceLink) => {
        if (!resourceLink) return <FileText size={16} />;
        const type = detectResourceType(resourceLink);
        switch (type) {
            case 'youtube':
            case 'video':
            case 'vimeo':
                return <Film size={16} />;
            case 'pdf':
            case 'powerpoint':
            case 'document':
            case 'excel':
                return <File size={16} />;
            case 'image':
                return <ImageIcon size={16} />;
            case 'audio':
                return <Music size={16} />;
            case 'blocked':
                return <ShieldAlert size={16} />;
            case 'gdrive':
                return <FileText size={16} />;
            default:
                return <FileText size={16} />;
        }
    };

    // Mark topic as completed
    const markTopicAsCompleted = (moduleId, topicId) => {
        setTopicProgress(prev => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                [topicId]: true
            }
        }));
        // Optional: Save to API here
    };

    // Calculate module progress
    const calculateProgress = (module) => {
        const topics = moduleTopics[module.id];
        if (!Array.isArray(topics) || topics.length === 0) return 0;
        
        const completedCount = topics.filter(topic => 
            topicProgress[module.id]?.[topic.id] === true
        ).length;
        
        return Math.round((completedCount / topics.length) * 100);
    };

    // Dynamic Header Title
    useEffect(() => {
        const titleWithBadge = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>My Courses</span>
                {modules.length > 0 && (
                    <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#4f46e5', 
                        color: 'white', 
                        padding: '4px 12px', 
                        borderRadius: '9999px',
                        fontWeight: '600',
                        lineHeight: '1'
                    }}>
                        {modules.length} {modules.length === 1 ? 'module' : 'modules'}
                    </span>
                )}
            </div>
        );
        setPageTitle(titleWithBadge);
        return () => setPageTitle('');
    }, [setPageTitle, modules.length]);

    // Fetch Modules
    useEffect(() => {
        const fetchTrainerData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!user || user.role !== 'trainer') {
                    throw new Error('Access denied');
                }

                try {
                    const modulesResponse = await api.get('/modules/', { params: { limit: 100, skip: 0 } });
                    const modulesData = modulesResponse.data;
                    
                    let trainerModules = [];
                    if (Array.isArray(modulesData)) trainerModules = modulesData;
                    else if (modulesData?.results) trainerModules = modulesData.results;
                    else if (modulesData?.data) trainerModules = modulesData.data;

                    setModules(trainerModules);
                } catch (modulesErr) {
                    console.error('Error fetching modules:', modulesErr);
                    setModules([]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainerData();
    }, [user]);

    const fetchTopicsForModule = async (moduleId) => {
        if (moduleTopics[moduleId]) {
            toggleModuleExpansion(moduleId);
            return;
        }

        try {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: true }));
            const res = await api.get('/topics/', { params: { module_id: moduleId, limit: 100 } });
            const data = res.data.results || res.data.data || res.data || [];
            
            setModuleTopics(prev => ({ ...prev, [moduleId]: Array.isArray(data) ? data : [] }));
            toggleModuleExpansion(moduleId);
        } catch (err) {
            setModuleTopics(prev => ({ ...prev, [moduleId]: { error: 'Failed to load topics' } }));
            toggleModuleExpansion(moduleId);
        } finally {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: false }));
        }
    };

    const toggleModuleExpansion = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleTopicClick = (topic, module) => {
        setSelectedTopic(topic);
        setSelectedModule(module);
        // Only mark text-only topics as complete immediately. 
        // Resources wait for load/play.
        if (!topic.resource_link) {
            markTopicAsCompleted(module.id, topic.id);
        }
    };

    /**
     * Fallback View for Audio, Blocked, or Error states
     */
    const renderFallbackView = (topic, type) => {
        const moduleId = selectedModule?.id;
        
        let icon = <File size={32} />;
        let title = "Resource Available";
        let message = "This resource cannot be displayed directly in the viewer.";
        let isError = false;

        if (type === 'audio') {
            icon = <Music size={32} />;
            title = "Audio File";
            message = "Audio playback is handled externally. Please download or open to listen.";
        } else if (type === 'blocked') {
            icon = <ShieldAlert size={32} />;
            title = "Preview Not Available";
            message = "This content provider does not allow embedding. Please open it in a new tab.";
            isError = true;
        }

        return (
            <div className={styles.fallbackContainer}>
                <div className={`${styles.fallbackIcon} ${isError ? styles.error : ''}`}>
                    {icon}
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className={styles.actionButtons}>
                    <a 
                        href={topic.resource_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.primaryActionBtn}
                        onClick={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                    >
                        <Download size={16} />
                        Download / Open
                    </a>
                </div>
            </div>
        );
    };

    /**
     * Main Resource Renderer
     */
    const renderResourceContent = (topic) => {
        const moduleId = selectedModule?.id;
        
        if (!topic.resource_link) {
            return (
                <div className={styles.textContent}>
                    <p>{topic.content || 'No content available'}</p>
                </div>
            );
        }

        const resourceType = detectResourceType(topic.resource_link);

        switch (resourceType) {
            // ------------------------------------
            // UNEMBEDDABLE TYPES (Audio, Blocked)
            // ------------------------------------
            case 'audio':
            case 'blocked':
                return renderFallbackView(topic, resourceType);

            // ------------------------------------
            // VIDEO PLATFORMS
            // ------------------------------------
            case 'youtube': {
                const videoId = getYouTubeVideoId(topic.resource_link);
                return (
                    <div className={styles.youtubePlayer}>
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title={topic.title}
                            className={styles.youtubeIframe}
                            frameBorder="0"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                        />
                    </div>
                );
            }

            case 'vimeo': {
                const vimeoId = topic.resource_link.split('/').pop();
                return (
                    <div className={styles.vimeoPlayer}>
                        <iframe
                            src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                            title={topic.title}
                            className={styles.vimeoIframe}
                            frameBorder="0"
                            allow="fullscreen; picture-in-picture"
                            allowFullScreen
                            onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                        />
                    </div>
                );
            }

            // ------------------------------------
            // DIRECT VIDEO FILES
            // ------------------------------------
            case 'video':
                return (
                    <div className={styles.videoPlayerContainer}>
                        {/* No autoPlay to avoid noise */}
                        <video 
                            controls 
                            controlsList="nodownload"
                            className={styles.videoPlayer} 
                            src={topic.resource_link}
                            onPlay={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            // ------------------------------------
            // DOCUMENTS & OFFICE (via Google Viewer)
            // ------------------------------------
            case 'gdrive': {
                const embedUrl = getGoogleDriveEmbedUrl(topic.resource_link);
                if (!embedUrl) return renderFallbackView(topic, 'blocked');
                
                return (
                    <div className={styles.gdriveViewer}>
                        <iframe 
                            src={embedUrl}
                            title={topic.title} 
                            className={styles.gdriveIframe}
                            onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                        />
                    </div>
                );
            }

            case 'pdf':
            case 'document':
            case 'powerpoint':
            case 'excel':
                return (
                    <div className={styles[resourceType + 'Viewer'] || styles.documentViewer}>
                        <iframe 
                            src={getGoogleViewerEmbedUrl(topic.resource_link)}
                            title={topic.title} 
                            className={styles.documentIframe}
                            onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                        />
                    </div>
                );

            // ------------------------------------
            // IMAGES
            // ------------------------------------
            case 'image':
                return (
                    <div className={styles.imageViewer}>
                        <img 
                            src={topic.resource_link} 
                            alt={topic.title} 
                            className={styles.imageDisplay}
                            onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                        />
                    </div>
                );

            // ------------------------------------
            // WEBPAGES
            // ------------------------------------
            case 'webpage':
            default:
                // Use sandbox to prevent popups/ads from the embedded page
                return (
                    <div className={styles.webpageViewer}>
                        <iframe
                            src={topic.resource_link}
                            title={topic.title}
                            className={styles.webpageIframe}
                            sandbox="allow-same-origin allow-scripts allow-forms"
                            onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}
                            onError={() => renderFallbackView(topic, 'blocked')}
                        />
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className={styles.coursesContainer}>
                <div className={styles.loadingState}>
                    <Loader2 size={48} className={styles.spinner} />
                    <span className={styles.loadingText}>Loading your modules...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.coursesContainer}>
                <div className={styles.errorState}>
                    <AlertCircle size={48} />
                    <span className={styles.errorText}>{error}</span>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                        <Loader2 size={16} style={{ marginRight: '8px' }} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.coursesContainer}>
            <div className={styles.mainContainer}>
                {/* Left Panel - Module List */}
                <div className={styles.leftPanel}>
                    <div className={styles.modulesHeader}>
                        <h2>My Learning Modules</h2>
                        <p>Track your progress and manage course content</p>
                    </div>

                    {modules.length > 0 ? (
                        <div className={styles.modulesList}>
                            {modules.map((module) => (
                                <div key={module.id} className={`${styles.moduleCard} ${expandedModules[module.id] ? styles.moduleCardExpanded : ''}`}>
                                    <div 
                                        className={styles.moduleHeader}
                                        onClick={() => fetchTopicsForModule(module.id)}
                                    >
                                        <div className={styles.moduleHeaderLeft}>
                                            <div className={styles.moduleIcon}>
                                                {expandedModules[module.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                            <div className={styles.moduleInfo}>
                                                <h4 className={styles.moduleTitle}>{module.title || 'Untitled Module'}</h4>
                                                {module.description && <p className={styles.moduleDescription}>{module.description}</p>}
                                            </div>
                                        </div>
                                        <div className={styles.moduleHeaderRight}>
                                            {loadingTopics[module.id] ? (
                                                <div className={styles.smallSpinner}></div>
                                            ) : (
                                                <button 
                                                    className={styles.viewModuleButton}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fetchTopicsForModule(module.id);
                                                    }}
                                                >
                                                    {expandedModules[module.id] ? 'Hide' : 'View'} Topics
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Module Progress Bar */}
                                    {expandedModules[module.id] && (
                                        <div className={styles.progressContainer}>
                                            <div className={styles.progressLabel}>
                                                <span>Progress</span>
                                                <span className={styles.progressPercent}>{calculateProgress(module)}%</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div 
                                                    className={styles.progressFill}
                                                    style={{ width: `${calculateProgress(module)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {expandedModules[module.id] && (
                                        <div className={styles.topicsSection}>
                                            {moduleTopics[module.id]?.length > 0 ? (
                                                <div className={styles.topicsList}>
                                                    {moduleTopics[module.id].map((topic, index) => {
                                                        const isCompleted = topicProgress[module.id]?.[topic.id] === true;
                                                        return (
                                                            <div 
                                                                key={topic.id} 
                                                                className={`${styles.topicCard} ${selectedTopic?.id === topic.id ? styles.topicCardActive : ''} ${isCompleted ? styles.topicCardCompleted : ''}`}
                                                                onClick={() => handleTopicClick(topic, module)}
                                                            >
                                                                <div className={styles.topicCardContent}>
                                                                    <div className={styles.topicIcon}>
                                                                        {getResourceIcon(topic.resource_link)}
                                                                    </div>
                                                                    <div className={styles.topicInfo}>
                                                                        <div className={styles.topicBadge}>{index + 1}</div>
                                                                        <h5 className={styles.topicTitle}>{topic.title}</h5>
                                                                        <p className={styles.topicDescription}>{topic.content}</p>
                                                                        {topic.resource_link && (
                                                                            <div className={styles.resourceTag}>
                                                                                {detectResourceType(topic.resource_link).toUpperCase()} {isCompleted && '✓'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {topic.resource_link && (
                                                                    <div className={styles.topicIconRight}>
                                                                        {isCompleted ? '✓' : <Download size={14} />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className={styles.noTopics}>No topics available in this module yet.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Module Not Assigned Card */
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <AlertCircle size={48} />
                            </div>
                            <h3 className={styles.emptyText}>No Modules Assigned</h3>
                            <p className={styles.emptyDescription}>
                                You have not been assigned to any modules yet. Please contact the administrator to get your domain and modules assigned.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Panel - Content Viewer */}
                <div className={styles.rightPanel}>
                    <div className={styles.contentViewer}>
                        <div className={styles.viewerHeader}>
                            <div className={styles.viewerHeaderTop}>
                                <h2>Content Viewer</h2>
                                {selectedTopic && selectedModule && (
                                    <span className={styles.moduleBadge}>{selectedModule.title}</span>
                                )}
                            </div>
                            {selectedTopic && (
                                <p className={styles.viewerTopicTitle}>{selectedTopic.title}</p>
                            )}
                        </div>

                        <div className={styles.viewerContent}>
                            {selectedTopic ? (
                                <>
                                    {/* Content Area */}
                                    <div className={styles.contentArea}>
                                        {renderResourceContent(selectedTopic)}
                                    </div>

                                    {/* Description */}
                                    <div className={styles.resourceDescription}>
                                        <h3>Topic Details</h3>
                                        <p>{selectedTopic.content || 'No description available'}</p>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.noSelection}>
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

export default TrainerCourses;