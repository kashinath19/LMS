import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentProfile from '../../components/profile/StudentProfile';
import { useOutletContext } from 'react-router-dom';

/**
 * StudentProfilePage - Route wrapper for the student profile
 * Redirects to student dashboard after profile creation
 */
const StudentProfilePage = () => {
    const navigate = useNavigate();
    const [profileExists, setProfileExists] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { setPageTitle } = useOutletContext();

    useEffect(() => {
        setPageTitle('Profile');
        return () => setPageTitle('');
    }, [setPageTitle]);

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => {
            setMessage({ type, text: '' });
        }, 5000);
    }, []);

    const handleProfileCreated = useCallback(() => {
        setProfileExists(true);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
            navigate('/student-dashboard');
        }, 700);
    }, [navigate]);

    return (
        <div style={{ width: '100%', minHeight: '100%' }}>
            {message.text && (
                <div
                    style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor:
                            message.type === 'success'
                                ? '#d1fae5'
                                : message.type === 'error'
                                ? '#fee2e2'
                                : '#dbeafe',
                        color:
                            message.type === 'success'
                                ? '#065f46'
                                : message.type === 'error'
                                ? '#991b1b'
                                : '#1e40af',
                        border: `1px solid ${
                            message.type === 'success'
                                ? '#10b981'
                                : message.type === 'error'
                                ? '#ef4444'
                                : '#3b82f6'
                        }`,
                    }}
                >
                    {message.text}
                </div>
            )}

            <StudentProfile
                showMessage={showMessage}
                onProfileCreated={handleProfileCreated}
                profileExists={profileExists}
                setProfileExists={setProfileExists}
            />
        </div>
    );
};

export default StudentProfilePage;
