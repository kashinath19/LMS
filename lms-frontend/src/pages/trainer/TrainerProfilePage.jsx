import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerProfile from '../../components/profile/TrainerProfile';

/**
 * TrainerProfilePage - Route wrapper for the trainer profile
 * Redirects trainer to dashboard after profile creation
 */
const TrainerProfilePage = () => {
    const navigate = useNavigate();
    const [profileExists, setProfileExists] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => {
            setMessage({ type, text: '' });
        }, 5000);
    }, []);

    const handleProfileCreated = useCallback(() => {
        setProfileExists(true);

        // Redirect to trainer dashboard after short delay
        setTimeout(() => {
            navigate('/trainer-dashboard');
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

            <TrainerProfile
                showMessage={showMessage}
                onProfileCreated={handleProfileCreated}
                profileExists={profileExists}
                setProfileExists={setProfileExists}
            />
        </div>
    );
};

export default TrainerProfilePage;
