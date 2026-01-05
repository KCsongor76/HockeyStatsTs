import React from 'react';
import {useRouteError, isRouteErrorResponse, useNavigate} from 'react-router-dom';
import Button from '../components/Button';

const ErrorPage: React.FC = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    let errorStatus: number | undefined;

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status;
    }

    return (
        <div>
            <div>
                <h1>
                    {errorStatus ? `Error ${errorStatus}` : 'Oops!'}
                </h1>
                <p>
                    Something went wrong!
                </p>
                <div>
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