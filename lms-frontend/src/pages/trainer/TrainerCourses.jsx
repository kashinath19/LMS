import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  FileText,
  AlertCircle,
  BookOpen,
  File,
  Film,
  Image as ImageIcon,
  Music,
  Loader2,
  Download,
  ShieldAlert,
  Maximize2,
  Minimize2,
  ChevronLeft,
  X,
  Layout,
  Play,
  Check
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import styles from './TrainerCourses.module.css';

// Hostnames known for showing ad overlays, blocking embeds, or non-study content
const HOST_DENYLIST = [
    'in.docs.wps.com',
    'preview.wps.com',
    'wps.com',
    'view.officeapps.live.com',
    'mediafire.com',
    'zippyshare.com'
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
    
    // View Mode State: 'default' -> 'theater' -> 'fullscreen'
    const [viewMode, setViewMode] = useState('default'); 
    
    // Theater Mode specific state for browsing modules
    const [theaterBrowsingModuleId, setTheaterBrowsingModuleId] = useState(null);

    // Progress tracking
    const [topicProgress, setTopicProgress] = useState({});
    
    // Refs
    const moduleRowRef = useRef(null);

    // ============================================================
    // RESOURCE DETECTION & SECURITY HELPER FUNCTIONS
    // ============================================================

    const isLocalResource = (url) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.includes('localhost') || 
               lowerUrl.includes('127.0.0.1') || 
               url.startsWith('/');
    };

    const isHostDenylisted = (url) => {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            return HOST_DENYLIST.some(blocked => hostname.includes(blocked));
        } catch (e) {
            return false;
        }
    };

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

    const getGoogleDriveEmbedUrl = (url) => {
        const driveId = extractGoogleDriveId(url);
        if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
        return null;
    };

    const getFileExtension = (url) => {
        try {
            const urlObj = new URL(url, 'http://localhost');
            const pathname = urlObj.pathname;
            return pathname.split('.').pop().toLowerCase();
        } catch (error) {
            const parts = url.split('.').pop().toLowerCase();
            return parts.split('?')[0];
        }
    };

    /**
     * SMART EMBED HELPER
     */
    const getSmartEmbedUrl = (url) => {
        if (!url) return '';
        const lower = url.toLowerCase();

        if (lower.includes('gamma.app')) {
            if (lower.includes('/embed/')) return url;
            return url.replace('/docs/', '/embed/');
        }
        if (lower.includes('canva.com')) {
            if (lower.includes('embed')) return url;
            const cleanUrl = url.replace(/\/+$/, ''); 
            if (cleanUrl.endsWith('/view')) return `${cleanUrl}?embed`;
            return `${cleanUrl}/view?embed`;
        }
        if (lower.includes('docs.google.com/presentation')) {
            if (lower.includes('/embed')) return url;
            return url.replace(/\/edit.*|\/preview.*/, '/embed?start=false&loop=false&delayms=3000');
        }
        if (lower.includes('pitch.com')) {
            return url; 
        }

        return url;
    };

    const detectResourceType = (url) => {
        if (!url) return 'text';
        if (isHostDenylisted(url)) return 'blocked';
        const lower = url.toLowerCase();

        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
        if (lower.includes('vimeo.com')) return 'vimeo';
        if (lower.includes('drive.google.com')) return 'gdrive';

        if (lower.includes('gamma.app') || 
            lower.includes('canva.com') || 
            lower.includes('docs.google.com/presentation') ||
            lower.includes('pitch.com')) {
            return 'smart_presentation';
        }

        const extension = getFileExtension(url);
        
        const audioExtensions = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac', 'wma'];
        if (audioExtensions.includes(extension)) return 'audio';

        if (extension === 'pdf') return 'pdf';
        if (['ppt', 'pptx', 'pps', 'ppsx'].includes(extension)) return 'powerpoint';
        if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document';
        if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
        
        const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp'];
        if (videoExtensions.includes(extension)) return 'video';
        
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        if (imageExtensions.includes(extension)) return 'image';

        return 'webpage';
    };

    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getGoogleViewerEmbedUrl = (url) => {
        return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
    };

    const getResourceIcon = (resourceLink) => {
        if (!resourceLink) return <FileText size={16} />;
        const type = detectResourceType(resourceLink);
        switch (type) {
            case 'youtube': case 'video': case 'vimeo': return <Film size={16} />;
            case 'pdf': case 'powerpoint': case 'document': case 'excel': return <File size={16} />;
            case 'image': return <ImageIcon size={16} />;
            case 'audio': return <Music size={16} />;
            case 'blocked': return <ShieldAlert size={16} />;
            case 'gdrive': return <FileText size={16} />;
            case 'smart_presentation': return <BookOpen size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const markTopicAsCompleted = (moduleId, topicId) => {
        setTopicProgress(prev => ({
            ...prev,
            [moduleId]: { ...prev[moduleId], [topicId]: true }
        }));
    };

    const calculateProgress = (module) => {
        const topics = moduleTopics[module.id];
        if (!Array.isArray(topics) || topics.length === 0) return 0;
        const completedCount = topics.filter(topic => topicProgress[module.id]?.[topic.id] === true).length;
        return Math.round((completedCount / topics.length) * 100);
    };

    // ============================================================
    // VIEW MODE & KEYBOARD CONTROLS
    // ============================================================

    // When entering Theater mode, sync browsing module to currently active module
    useEffect(() => {
        if (viewMode === 'theater' && selectedModule && !theaterBrowsingModuleId) {
            setTheaterBrowsingModuleId(selectedModule.id);
        }
    }, [viewMode, selectedModule]);

    const handleViewCycle = () => {
        if (viewMode === 'default') setViewMode('theater');
        else if (viewMode === 'theater') setViewMode('fullscreen');
        else setViewMode('default');
    };

    const handleEscapeKey = () => {
        if (viewMode === 'fullscreen') setViewMode('default');
        else if (viewMode === 'theater') setViewMode('default');
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setViewMode(prev => prev === 'fullscreen' ? 'default' : 'fullscreen');
            }
            if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setViewMode(prev => prev === 'theater' ? 'default' : 'theater');
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                handleEscapeKey();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [viewMode]);
    
    // Focus regain hack for iframes
    useEffect(() => {
        const regainFocus = () => {
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                window.focus();
            }
        };
        window.addEventListener('mouseover', regainFocus);
        return () => window.removeEventListener('mouseover', regainFocus);
    }, []);

    useEffect(() => {
        const titleWithBadge = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>My Courses</span>
                {modules.length > 0 && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#4f46e5', color: 'white', padding: '4px 12px', borderRadius: '9999px', fontWeight: '600', lineHeight: '1' }}>
                        {modules.length} {modules.length === 1 ? 'module' : 'modules'}
                    </span>
                )}
            </div>
        );
        setPageTitle(titleWithBadge);
        return () => setPageTitle('');
    }, [setPageTitle, modules.length]);

    useEffect(() => {
        const fetchTrainerData = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!user || user.role !== 'trainer') throw new Error('Access denied');
                try {
                    const modulesResponse = await api.get('/modules/', { params: { limit: 100, skip: 0 } });
                    const modulesData = modulesResponse.data;
                    let trainerModules = [];
                    if (Array.isArray(modulesData)) trainerModules = modulesData;
                    else if (modulesData?.results) trainerModules = modulesData.results;
                    else if (modulesData?.data) trainerModules = modulesData.data;
                    setModules(trainerModules);
                } catch (modulesErr) {
                    setModules([]);
                }
            } catch (err) {
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

    // Helper to fetch without toggling accordion (for Theater mode click)
    const loadTopicsSilent = async (moduleId) => {
        if (moduleTopics[moduleId]) return;
        try {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: true }));
            const res = await api.get('/topics/', { params: { module_id: moduleId, limit: 100 } });
            const data = res.data.results || res.data.data || res.data || [];
            setModuleTopics(prev => ({ ...prev, [moduleId]: Array.isArray(data) ? data : [] }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: false }));
        }
    };

    const toggleModuleExpansion = (id) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

    const handleTopicClick = (topic, module) => {
        setSelectedTopic(topic);
        setSelectedModule(module);
        // If in theater mode and clicking a topic, ensure we stay there
        if (!topic.resource_link) markTopicAsCompleted(module.id, topic.id);
    };

    // Theater Mode specific handler
    const handleTheaterModuleClick = (module) => {
        setTheaterBrowsingModuleId(module.id);
        loadTopicsSilent(module.id);
    };

    const renderFallbackView = (topic, type) => {
        const moduleId = selectedModule?.id;
        let icon = <File size={32} />;
        let title = "Resource Available";
        let message = "This resource cannot be displayed directly in the viewer.";
        let isError = false;

        if (type === 'audio') { icon = <Music size={32} />; title = "Audio File"; message = "Audio playback is handled externally."; }
        else if (type === 'blocked') { icon = <ShieldAlert size={32} />; title = "Preview Not Available"; message = "Content provider blocks embedding."; isError = true; }
        else if (type === 'local_office') { icon = <FileText size={32} />; title = "Local Document"; message = "Local documents cannot be previewed in the browser."; }

        return (
            <div className={styles.fallbackContainer}>
                <div className={`${styles.fallbackIcon} ${isError ? styles.error : ''}`}>{icon}</div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className={styles.actionButtons}>
                    <a href={topic.resource_link} target="_blank" rel="noopener noreferrer" className={styles.primaryActionBtn} onClick={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}>
                        <Download size={16} /> Download / Open
                    </a>
                </div>
            </div>
        );
    };

    const renderResourceContent = (topic) => {
        const moduleId = selectedModule?.id;
        if (!topic.resource_link) return (<div className={styles.textContent}><p>{topic.content || 'No content available'}</p></div>);

        const resourceType = detectResourceType(topic.resource_link);
        const isLocal = isLocalResource(topic.resource_link);

        const commonIframeProps = {
            onLoad: () => moduleId && markTopicAsCompleted(moduleId, topic.id),
            allow: "fullscreen; clipboard-write; encrypted-media; picture-in-picture; gyroscope; accelerometer",
            sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
        };

        switch (resourceType) {
            case 'audio': case 'blocked': return renderFallbackView(topic, resourceType);
            case 'youtube': {
                const videoId = getYouTubeVideoId(topic.resource_link);
                return (<div className={styles.youtubePlayer}><iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} title={topic.title} className={styles.youtubeIframe} frameBorder="0" {...commonIframeProps} /></div>);
            }
            case 'vimeo': {
                const vimeoId = topic.resource_link.split('/').pop();
                return (<div className={styles.vimeoPlayer}><iframe src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`} title={topic.title} className={styles.vimeoIframe} frameBorder="0" {...commonIframeProps} /></div>);
            }
            case 'video': return (<div className={styles.videoPlayerContainer}><video controls controlsList="nodownload" className={styles.videoPlayer} src={topic.resource_link} onPlay={() => moduleId && markTopicAsCompleted(moduleId, topic.id)}>Your browser does not support the video tag.</video></div>);
            case 'gdrive': {
                const embedUrl = getGoogleDriveEmbedUrl(topic.resource_link);
                if (!embedUrl) return renderFallbackView(topic, 'blocked');
                return (<div className={styles.gdriveViewer}><div className={styles.iframeWrapper}><iframe src={embedUrl} title={topic.title} className={styles.gdriveIframe} {...commonIframeProps} /><div className={styles.googleDrivePopOutMask}></div></div></div>);
            }
            case 'smart_presentation': {
                const embedUrl = getSmartEmbedUrl(topic.resource_link);
                return (<div className={styles.webpageViewer}><iframe src={embedUrl} title={topic.title} className={styles.webpageIframe} {...commonIframeProps} /></div>);
            }
            case 'pdf': return (<div className={styles.pdfViewer}><iframe src={isLocal ? topic.resource_link : getGoogleViewerEmbedUrl(topic.resource_link)} title={topic.title} className={styles.pdfIframe} onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)} /></div>);
            case 'document': case 'powerpoint': case 'excel':
                if (isLocal) return renderFallbackView(topic, 'local_office');
                return (<div className={styles.documentViewer}><iframe src={getGoogleViewerEmbedUrl(topic.resource_link)} title={topic.title} className={styles.documentIframe} onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)} /></div>);
            case 'image': return (<div className={styles.imageViewer}><img src={topic.resource_link} alt={topic.title} className={styles.imageDisplay} onLoad={() => moduleId && markTopicAsCompleted(moduleId, topic.id)} /></div>);
            default: return (<div className={styles.webpageViewer}><iframe src={topic.resource_link} title={topic.title} className={styles.webpageIframe} {...commonIframeProps} onError={() => renderFallbackView(topic, 'blocked')} /></div>);
        }
    };

    if (loading) return (<div className={styles.coursesContainer}><div className={styles.loadingState}><Loader2 size={48} className={styles.spinner} /><span className={styles.loadingText}>Loading your modules...</span></div></div>);
    if (error) return (<div className={styles.coursesContainer}><div className={styles.errorState}><AlertCircle size={48} /><span className={styles.errorText}>{error}</span><button onClick={() => window.location.reload()} className={styles.retryBtn}><Loader2 size={16} style={{ marginRight: '8px' }} /> Retry</button></div></div>);

    const isDefaultView = viewMode === 'default';
    const isTheaterMode = viewMode === 'theater';

    if (viewMode === 'fullscreen') {
        return (
            <div className={styles.fullscreenContainer}>
                <button className={styles.floatingExitBtn} onClick={() => setViewMode('default')} title="Exit Fullscreen to Default View">
                    <X size={24} />
                </button>
                <div className={styles.fullscreenContent}>
                    {selectedTopic ? renderResourceContent(selectedTopic) : (
                        <div className={styles.noSelection}><BookOpen size={64} /><h3>No Content Selected</h3><p>Press ESC to exit</p></div>
                    )}
                </div>
            </div>
        );
    }

    const getToggleIcon = () => {
        if (viewMode === 'default') return <Maximize2 size={20} />; 
        if (viewMode === 'theater') return <Maximize2 size={20} />;
        return <Minimize2 size={20} />;
    };

    const getToggleTitle = () => {
        if (viewMode === 'default') return "Switch to Theater Mode (T)";
        if (viewMode === 'theater') return "Switch to Fullscreen (F)";
        return "Exit View";
    };

    return (
        <div className={`${styles.coursesContainer} ${isTheaterMode ? styles.coursesContainerScrollable : ''}`}>
            <div className={`${styles.mainContainer} ${isTheaterMode ? styles.mainContainerTheater : ''}`}>
                {/* Left Panel */}
                {isDefaultView && (
                    <div className={styles.leftPanel}>
                        <div className={styles.modulesHeader}>
                            <h2>My Learning Modules</h2>
                            <p>Track your progress and manage course content</p>
                        </div>
                        {modules.length > 0 ? (
                            <div className={styles.modulesList}>
                                {modules.map((module) => (
                                    <div key={module.id} className={`${styles.moduleCard} ${expandedModules[module.id] ? styles.moduleCardExpanded : ''}`}>
                                        <div className={styles.moduleHeader} onClick={() => fetchTopicsForModule(module.id)}>
                                            <div className={styles.moduleHeaderLeft}>
                                                <div className={styles.moduleIcon}>{expandedModules[module.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                                                <div className={styles.moduleInfo}>
                                                    <h4 className={styles.moduleTitle}>{module.title || 'Untitled Module'}</h4>
                                                    {module.description && <p className={styles.moduleDescription}>{module.description}</p>}
                                                </div>
                                            </div>
                                            <div className={styles.moduleHeaderRight}>
                                                {loadingTopics[module.id] ? <div className={styles.smallSpinner}></div> : 
                                                <button className={styles.viewModuleButton} onClick={(e) => { e.stopPropagation(); fetchTopicsForModule(module.id); }}>{expandedModules[module.id] ? 'Hide' : 'View'} Topics</button>}
                                            </div>
                                        </div>
                                        {expandedModules[module.id] && (
                                            <>
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressLabel}><span>Progress</span><span className={styles.progressPercent}>{calculateProgress(module)}%</span></div>
                                                <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${calculateProgress(module)}%` }}></div></div>
                                            </div>
                                            <div className={styles.topicsSection}>
                                                {moduleTopics[module.id]?.length > 0 ? (
                                                    <div className={styles.topicsList}>
                                                        {moduleTopics[module.id].map((topic, index) => {
                                                            const isCompleted = topicProgress[module.id]?.[topic.id] === true;
                                                            return (
                                                                <div key={topic.id} className={`${styles.topicCard} ${selectedTopic?.id === topic.id ? styles.topicCardActive : ''} ${isCompleted ? styles.topicCardCompleted : ''}`} onClick={() => handleTopicClick(topic, module)}>
                                                                    <div className={styles.topicCardContent}>
                                                                        <div className={styles.topicIcon}>{getResourceIcon(topic.resource_link)}</div>
                                                                        <div className={styles.topicInfo}>
                                                                            <div className={styles.topicBadge}>{index + 1}</div>
                                                                            <h5 className={styles.topicTitle}>{topic.title}</h5>
                                                                            <p className={styles.topicDescription}>{topic.content}</p>
                                                                            {topic.resource_link && <div className={styles.resourceTag}>{detectResourceType(topic.resource_link).toUpperCase()} {isCompleted && '✓'}</div>}
                                                                        </div>
                                                                    </div>
                                                                    {topic.resource_link && <div className={styles.topicIconRight}>{isCompleted ? '✓' : <Download size={14} />}</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (<div className={styles.noTopics}>No topics available.</div>)}
                                            </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (<div className={styles.emptyState}><div className={styles.emptyIcon}><AlertCircle size={48} /></div><h3 className={styles.emptyText}>No Modules Assigned</h3><p className={styles.emptyDescription}>Contact admin for access.</p></div>)}
                    </div>
                )}

                {/* Right Panel */}
                <div className={`${styles.rightPanel} ${isTheaterMode ? styles.rightPanelTheater : ''}`}>
                    <div className={styles.contentViewer}>
                        <div className={styles.viewerHeader}>
                            <div className={styles.viewerHeaderTop}>
                                <h2>Content Viewer</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {selectedTopic && selectedModule && <span className={styles.moduleBadge}>{selectedModule.title}</span>}
                                    <button className={styles.theaterModeBtn} onClick={handleViewCycle} title={getToggleTitle()}>
                                        {getToggleIcon()}
                                    </button>
                                </div>
                            </div>
                            {selectedTopic && <p className={styles.viewerTopicTitle}>{selectedTopic.title}</p>}
                        </div>

                        <div className={styles.viewerContent}>
                            {selectedTopic ? (
                                <>
                                    <div className={styles.contentArea}>{renderResourceContent(selectedTopic)}</div>
                                    {isDefaultView && (
                                        <div className={styles.resourceDescription}>
                                            <h3>Topic Details</h3>
                                            <p>{selectedTopic.content || 'No description available'}</p>
                                        </div>
                                    )}
                                </>
                            ) : (<div className={styles.noSelection}><BookOpen size={64} /><h3>No Content Selected</h3><p>Select a topic to view</p></div>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================
                THEATER MODE: TABBED PLAYLIST UI
               ========================================= */}
            {isTheaterMode && modules.length > 0 && (
                <div className={styles.theaterContainer}>
                    {/* Row 1: Module Navigation Strip (Tabs) */}
                    <div className={styles.theaterModulesTabs} ref={moduleRowRef}>
                        {modules.map((module) => {
                            const isActive = theaterBrowsingModuleId === module.id;
                            const isCompleted = calculateProgress(module) === 100;
                            return (
                                <div 
                                    key={module.id} 
                                    className={`${styles.theaterModuleTab} ${isActive ? styles.theaterModuleTabActive : ''}`}
                                    onClick={() => handleTheaterModuleClick(module)}
                                >
                                    <div className={`${styles.tabProgressDot} ${isCompleted ? styles.tabProgressDotCompleted : ''}`}></div>
                                    <span>{module.title}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Row 2: Topics List (Playlist Style) */}
                    <div className={styles.theaterTopicsArea}>
                        {theaterBrowsingModuleId && (
                            <>
                                {loadingTopics[theaterBrowsingModuleId] ? (
                                    <div style={{ padding: '20px', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div className={styles.smallSpinner}></div> Loading topics...
                                    </div>
                                ) : moduleTopics[theaterBrowsingModuleId]?.length > 0 ? (
                                    <div className={styles.theaterTopicsList}>
                                        {moduleTopics[theaterBrowsingModuleId].map((topic, index) => {
                                            const isActive = selectedTopic?.id === topic.id;
                                            const isCompleted = topicProgress[theaterBrowsingModuleId]?.[topic.id];
                                            return (
                                                <div 
                                                    key={topic.id}
                                                    className={`${styles.theaterTopicItem} ${isActive ? styles.theaterTopicItemActive : ''}`}
                                                    onClick={() => handleTopicClick(topic, modules.find(m => m.id === theaterBrowsingModuleId))}
                                                >
                                                    <div className={styles.theaterTopicIconWrapper}>
                                                        {isActive ? <Play size={16} fill="currentColor" /> : 
                                                         isCompleted ? <Check size={16} /> : 
                                                         index + 1}
                                                    </div>
                                                    <div className={styles.theaterTopicMeta}>
                                                        <h5>{topic.title}</h5>
                                                        <span>{detectResourceType(topic.resource_link)}</span>
                                                    </div>
                                                    <div className={styles.theaterTopicStatus}>
                                                        {isCompleted && (
                                                            <div className={styles.statusCheck}><Check size={14} /></div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={styles.noTopicsMessage}>No topics available in this module.</div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerCourses;