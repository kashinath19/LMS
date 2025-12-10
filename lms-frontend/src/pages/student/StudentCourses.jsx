import React from 'react';
import { Box } from 'lucide-react';

/**
 * StudentCourses - Placeholder page for student courses
 * Will be implemented in a future update
 */
const StudentCourses = () => {
    return (
        <div className="student-courses-page" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                }}>
                    My Courses
                </h1>
            </div>

            <div style={{
                width: '100%',
                flex: 1,
                padding: '40px 20px',
                border: '2px dashed #e5e7eb',
                borderRadius: '12px',
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                textAlign: 'center'
            }}>
                <Box size={48} style={{ marginBottom: '16px', color: '#9ca3af' }} />
                <span style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                    color: '#374151'
                }}>
                    No Courses Yet
                </span>
                <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                }}>
                    Your enrolled courses will appear here. Check back soon!
                </p>
            </div>
        </div>
    );
};

export default StudentCourses;
