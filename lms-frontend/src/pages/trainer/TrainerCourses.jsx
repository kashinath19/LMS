import React from 'react';
import { BookOpen } from 'lucide-react';
import styles from './TrainerCourses.module.css';
import AuthContext from '../../context/AuthContext';

/**
 * TrainerCourses - Placeholder page for trainer courses
 * Will be implemented with course management functionality
 */
const TrainerCourses = () => {
    return (
        <div className={styles.coursesContainer}>
            <div className={styles.header}>
                <h1>My Courses</h1>
            </div>
            <div className={styles.emptyState}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <span className={styles.emptyText}>No courses yet</span>
                <p className={styles.emptyDescription}>
                    Your courses will appear here. Start creating and managing your training content.
                </p>
            </div>
        </div>
    );
};

export default TrainerCourses;
