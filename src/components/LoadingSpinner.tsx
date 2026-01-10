import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({overlay}) => {
    return (
        <div className={`${styles.loadingContainer} ${overlay ? styles.overlay : ''}`}>
            <div className={styles.spinner}></div>
        </div>
    );
};

export default LoadingSpinner;