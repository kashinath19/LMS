import React, { useState, useEffect, useContext } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  FileText,
  ExternalLink,
  AlertCircle 
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import styles from './TrainerCourses.module.css';

const TrainerCourses = () => {
    const { user } = useContext(AuthContext);
    const { setPageTitle } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    const [moduleTopics, setModuleTopics] = useState({});
    const [loadingTopics, setLoadingTopics] = useState({});

    // Dynamic Header Title
    useEffect(() => {
        const titleWithBadge = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>My Modules & Topics</span>
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

    useEffect(() => {
        const fetchTrainerData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!user || user.role !== 'trainer') {
                    throw new Error('Access denied');
                }

                // Fetch modules
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

    if (loading) {
        return (
            <div className={styles.coursesContainer}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <span className={styles.loadingText}>Loading your modules...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.coursesContainer}>
            <div className={styles.modulesSection}>
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
                                
                                {expandedModules[module.id] && (
                                    <div className={styles.topicsSection}>
                                        <div className={styles.topicsHeader}>
                                            <FileText size={18} />
                                            <span>Topics</span>
                                        </div>
                                        {moduleTopics[module.id]?.length > 0 ? (
                                            <div className={styles.topicsList}>
                                                {moduleTopics[module.id].map(topic => (
                                                    <div key={topic.id} className={styles.topicCard}>
                                                        <h5 className={styles.topicTitle}>{topic.title}</h5>
                                                        <p className={styles.topicDescription}>{topic.content}</p>
                                                        {topic.resource_link && (
                                                            <div className={styles.resourceLink}>
                                                                <ExternalLink size={14} />
                                                                <a href={topic.resource_link} target="_blank" rel="noreferrer" className={styles.resourceAnchor}>View Resource</a>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.noTopics}>No topics available.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Module Not Assigned Card */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px 24px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        maxWidth: '500px',
                        margin: '40px auto',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: '#ef4444'
                        }}>
                            <AlertCircle size={32} />
                        </div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '12px'
                        }}>
                            Module Not Assigned
                        </h3>
                        <p style={{
                            fontSize: '0.95rem',
                            color: '#6b7280',
                            marginBottom: '24px',
                            lineHeight: '1.5'
                        }}>
                            You have not been assigned to any modules yet. Please contact the administrator to get your domain and modules assigned.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerCourses;