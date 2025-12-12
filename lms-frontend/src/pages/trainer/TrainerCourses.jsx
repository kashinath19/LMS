import React, { useState, useEffect, useContext } from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  FileText,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import styles from './TrainerCourses.module.css';

/**
 * TrainerCourses - Trainer page showing modules and topics
 */
const TrainerCourses = () => {
    const { user } = useContext(AuthContext);
    const [trainerInfo, setTrainerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    const [moduleTopics, setModuleTopics] = useState({});
    const [loadingTopics, setLoadingTopics] = useState({});

    useEffect(() => {
        const fetchTrainerData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check if user is authenticated
                if (!user) {
                    throw new Error('No authenticated user found. Please log in.');
                }

                // Check if user is a trainer
                if (user.role !== 'trainer') {
                    throw new Error('This page is only accessible to trainers.');
                }

                // Use the authenticated trainer data
                const trainerData = user;
                
                // Fetch modules for the trainer's domain
                let trainerModules = [];
                try {
                    const modulesResponse = await api.get('/modules/', {
                        params: {
                            limit: 100,
                            skip: 0
                        }
                    });
                    
                    const modulesData = modulesResponse.data;
                    
                    // Handle different response formats
                    if (Array.isArray(modulesData)) {
                        trainerModules = modulesData;
                    } else if (modulesData?.results) {
                        trainerModules = modulesData.results;
                    } else if (modulesData?.data) {
                        trainerModules = modulesData.data;
                    }
                    
                } catch (modulesErr) {
                    console.error('Error fetching modules:', modulesErr);
                    trainerModules = [];
                }
                
                setTrainerInfo(trainerData);
                setModules(trainerModules);
                
            } catch (err) {
                console.error('Error fetching trainer data:', err);
                const errorMessage = err.response?.data?.detail || 
                                   err.response?.data?.message || 
                                   err.message || 
                                   'Failed to load trainer information';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainerData();
    }, [user]);

    const fetchTopicsForModule = async (moduleId) => {
        if (moduleTopics[moduleId]) {
            // Topics already loaded, just toggle expansion
            toggleModuleExpansion(moduleId);
            return;
        }

        try {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: true }));
            
            const topicsResponse = await api.get('/topics/', {
                params: {
                    module_id: moduleId,
                    limit: 100,
                    skip: 0
                }
            });
            
            const topicsData = topicsResponse.data;
            let topicsList = [];
            
            // Handle different response formats
            if (Array.isArray(topicsData)) {
                topicsList = topicsData;
            } else if (topicsData?.results) {
                topicsList = topicsData.results;
            } else if (topicsData?.data) {
                topicsList = topicsData.data;
            }
            
            setModuleTopics(prev => ({
                ...prev,
                [moduleId]: topicsList
            }));
            
            toggleModuleExpansion(moduleId);
            
        } catch (err) {
            console.error('Error fetching topics for module:', moduleId, err);
            const errorMessage = err.response?.data?.detail || 
                               err.response?.data?.message || 
                               err.message || 
                               'Failed to load topics';
            
            // Set error state for this module
            setModuleTopics(prev => ({
                ...prev,
                [moduleId]: { error: errorMessage }
            }));
            
            toggleModuleExpansion(moduleId);
        } finally {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: false }));
        }
    };

    const toggleModuleExpansion = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.coursesContainer}>
                <div className={styles.header}>
                    <h1>My Modules & Topics</h1>
                </div>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <span className={styles.loadingText}>Loading your modules...</span>
                </div>
            </div>
        );
    }

    // Error state - only show if we have a critical error
    if (error && modules.length === 0) {
        return (
            <div className={styles.coursesContainer}>
                <div className={styles.header}>
                    <h1>My Modules & Topics</h1>
                </div>
                <div className={styles.errorState}>
                    <span className={styles.errorText}>Error: {error}</span>
                    <button 
                        className={styles.retryButton}
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // If no trainer info
    if (!trainerInfo) {
        return (
            <div className={styles.coursesContainer}>
                <div className={styles.header}>
                    <h1>My Modules & Topics</h1>
                </div>
                <div className={styles.errorState}>
                    <span className={styles.errorText}>No trainer information available.</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.coursesContainer}>
            <div className={styles.header}>
                <h1>My Modules & Topics</h1>
                <div className={styles.welcomeMessage}>
                    Welcome back, <span className={styles.trainerName}>{trainerInfo.username}</span>!
                </div>
            </div>

            {/* Error banner if modules failed to load */}
            {error && (
                <div className={styles.errorBanner}>
                    <span className={styles.errorBannerText}>
                        Warning: {error} Modules list may be incomplete.
                    </span>
                </div>
            )}

            {/* Modules & Topics Section */}
            <div className={styles.modulesSection}>
                <div className={styles.sectionHeader}>
                    <h2>Modules & Topics</h2>
                    <span className={styles.modulesCount}>
                        {modules.length} {modules.length === 1 ? 'module' : 'modules'}
                    </span>
                </div>
                
                {modules.length > 0 ? (
                    <div className={styles.modulesList}>
                        {modules.map((module) => (
                            <div key={module.id} className={styles.moduleCard}>
                                <div 
                                    className={styles.moduleHeader}
                                    onClick={() => fetchTopicsForModule(module.id)}
                                >
                                    <div className={styles.moduleHeaderLeft}>
                                        <div className={styles.moduleIcon}>
                                            {expandedModules[module.id] ? 
                                                <ChevronDown size={20} /> : 
                                                <ChevronRight size={20} />
                                            }
                                        </div>
                                        <div className={styles.moduleInfo}>
                                            <h4 className={styles.moduleTitle}>
                                                {module.title || 'Untitled Module'}
                                            </h4>
                                            {module.description && (
                                                <p className={styles.moduleDescription}>
                                                    {module.description}
                                                </p>
                                            )}
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
                                
                                {/* Topics Section - Collapsible */}
                                {expandedModules[module.id] && (
                                    <div className={styles.topicsSection}>
                                        <div className={styles.topicsHeader}>
                                            <FileText size={18} />
                                            <span>Topics in this Module</span>
                                        </div>
                                        
                                        {moduleTopics[module.id] ? (
                                            moduleTopics[module.id].error ? (
                                                <div className={styles.topicsError}>
                                                    <span className={styles.errorText}>
                                                        Error: {moduleTopics[module.id].error}
                                                    </span>
                                                </div>
                                            ) : Array.isArray(moduleTopics[module.id]) ? (
                                                <div className={styles.topicsList}>
                                                    {moduleTopics[module.id].length > 0 ? (
                                                        moduleTopics[module.id].map((topic) => {
                                                            // Clean the content to remove any "View Details" text
                                                            let cleanedContent = topic.content;
                                                            if (cleanedContent) {
                                                                // Remove "View Details" text from content
                                                                cleanedContent = cleanedContent.replace(/View Details/gi, '').trim();
                                                                // Remove any trailing hyphens or separators
                                                                cleanedContent = cleanedContent.replace(/[-—]+$/g, '').trim();
                                                            }
                                                            
                                                            return (
                                                                <div key={topic.id} className={styles.topicCard}>
                                                                    <div className={styles.topicHeader}>
                                                                        <h5 className={styles.topicTitle}>
                                                                            {topic.title || 'Untitled Topic'}
                                                                        </h5>
                                                                    </div>
                                                                    
                                                                    <div className={styles.topicContent}>
                                                                        {cleanedContent && (
                                                                            <p className={styles.topicDescription}>
                                                                                {cleanedContent.length > 200 
                                                                                    ? `${cleanedContent.substring(0, 200)}...`
                                                                                    : cleanedContent
                                                                                }
                                                                            </p>
                                                                        )}
                                                                        
                                                                        {topic.resource_link && (
                                                                            <div className={styles.resourceLink}>
                                                                                <ExternalLink size={16} />
                                                                                <a 
                                                                                    href={topic.resource_link} 
                                                                                    target="_blank" 
                                                                                    rel="noopener noreferrer"
                                                                                    className={styles.resourceAnchor}
                                                                                >
                                                                                    View Resource
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className={styles.noTopics}>
                                                            <FileText size={32} className={styles.noTopicsIcon} />
                                                            <span className={styles.noTopicsText}>
                                                                No topics available for this module
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={styles.noTopics}>
                                                    <FileText size={32} className={styles.noTopicsIcon} />
                                                    <span className={styles.noTopicsText}>
                                                        No topics data available
                                                    </span>
                                                </div>
                                            )
                                        ) : (
                                            <div className={styles.loadingTopics}>
                                                <div className={styles.smallSpinner}></div>
                                                <span>Loading topics...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <BookOpen size={48} className={styles.emptyIcon} />
                        <span className={styles.emptyText}>No modules found</span>
                        <p className={styles.emptyDescription}>
                            {error ? 'Could not load modules. Please check your connection and try again.' : 'You don\'t have any modules assigned to you yet. Modules will appear here when they are created.'}
                        </p>
                        <button 
                            className={styles.retryButton}
                            onClick={() => window.location.reload()}
                            style={{ marginTop: '16px' }}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerCourses;