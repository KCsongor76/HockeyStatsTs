import React from 'react';
import {Outlet, useNavigation} from 'react-router-dom';
import MainNavigation from "./MainNavigation";
import LoadingSpinner from './LoadingSpinner'; // Import your LoadingSpinner component

interface props {
    isSignedIn: boolean | undefined;
}

const RootLayout = ({isSignedIn}: props) => {
    const navigation = useNavigation();

    return (
        <div>
            <MainNavigation isSignedIn={isSignedIn}/>
            <main>
                {/* Show loading spinner when navigating between routes */}
                {navigation.state === 'loading' && <LoadingSpinner />}
                <Outlet/>
            </main>
        </div>
    );
};

export default RootLayout;