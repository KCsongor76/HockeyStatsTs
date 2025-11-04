import {useNavigation} from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import React from "react";

const RouterLoading: React.FC = () => {
    const navigation = useNavigation();

    // Show loading spinner when navigating
    if (navigation.state === 'loading') {
        return <LoadingSpinner/>;
    }

    return null;
};

export default RouterLoading;