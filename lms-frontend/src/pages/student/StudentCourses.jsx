import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ExternalLink, ChevronDown, ChevronUp, Loader2, AlertCircle, LogIn } from 'lucide-react';
import './StudentCourses.css';

const StudentCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModuleId, setExpandedModuleId] = useState(null);

    // FIX 1: Set Base URL to the root domain (without /api/v1 suffix to avoid duplication)
    const API_BASE_URL = 'https://learning-management-system-a258.onrender.com';

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setLoading(true);
                
                // FIX 2: Retrieve the token from localStorage
                // (Ensure this key matches what you used during login, e.g., 'access_token' or 'token')
                const token = localStorage.getItem('access_token');

                if (!token) {
                    throw new Error("No authentication token found. Please log in.");
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                // Fetch Modules and Topics in parallel
                // FIX 3: Corrected endpoints to ensure single /api/v1/ path
                const [modulesRes, topicsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/modules/?limit=100`, { headers }),
                    fetch(`${API_BASE_URL}/api/v1/topics/?limit=1000`, { headers }) 
                ]);

                // Handle 401 specifically
                if (modulesRes.status === 401 || topicsRes.status === 401) {
                    throw new Error("Unauthorized: Your session may have expired. Please log in again.");
                }

                if (!modulesRes.ok) {
                    throw new Error(`Modules API Error: ${modulesRes.statusText}`);
                }
                if (!topicsRes.ok) {
                    throw new Error(`Topics API Error: ${topicsRes.statusText}`);
                }

                const modulesData = await modulesRes.json();
                const topicsData = await topicsRes.json();

                // Organize data: Add topics array to each module
                const organizedCourses = modulesData.map(module => {
                    const moduleTopics = topicsData
                        .filter(topic => topic.module_id === module.id)
                        .sort((a, b) => a.order_index - b.order_index); // Sort topics by order

                    return {
                        ...module,
                        topics: moduleTopics
                    };
                }).sort((a, b) => a.order_index - b.order_index); // Sort modules by order

                setCourses(organizedCourses);
                setError(null);
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, []);

    const toggleModule = (id) => {
        setExpandedModuleId(expandedModuleId === id ? null : id);
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
                     // Optional: Add a redirect logic here if you have navigation set up
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
            <header className="sc-header">
                <div className="sc-header-content">
                    <h1>My Learning Modules</h1>
                    <p>Track your progress and access course materials</p>
                </div>
            </header>

            <div className="sc-content">
                {courses.length === 0 ? (
                    <div className="sc-empty-state">
                        <BookOpen size={48} />
                        <h3>No Modules Assigned</h3>
                        <p>You haven't been assigned to any domain modules yet.</p>
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
                                                                <a 
                                                                    href={topic.resource_link} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="sc-topic-link"
                                                                >
                                                                    <ExternalLink size={14} />
                                                                    View Resource
                                                                </a>
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
        </div>
    );
};

export default StudentCourses;