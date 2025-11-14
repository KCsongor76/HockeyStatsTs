import React from 'react';
import {useRouteError, isRouteErrorResponse, useNavigate} from 'react-router-dom';
import Button from '../components/Button';
import styles from './ErrorPage.module.css';

const ErrorPage: React.FC = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    let errorStatus: number | undefined;

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status;
    }

    return (
        <div className={styles.errorContainer}>
            <div className={styles.errorContent}>
                <h1 className={styles.errorTitle}>
                    {errorStatus ? `Error ${errorStatus}` : 'Oops!'}
                </h1>
                <p className={styles.errorMessage}>
                    Something went wrong!
                </p>
                <div className={styles.errorActions}>
                    <Button
                        styleType="positive"
                        onClick={() => navigate('/')}
                    >
                        Go to Home Page
                    </Button>
                    <Button
                        styleType="neutral"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;