import React from 'react';
import {Outlet, useNavigation} from 'react-router-dom';
import MainNavigation from "./MainNavigation";
import LoadingSpinner from './LoadingSpinner';

interface props {
    isSignedIn: boolean | undefined;
}

const RootLayout = ({isSignedIn}: props) => {
    const navigation = useNavigation();

    return (
        <div>
            <MainNavigation isSignedIn={isSignedIn}/>
            <main>
                {navigation.state === 'loading' && <LoadingSpinner />}
                <Outlet/>
            </main>
        </div>
    );
};

export default RootLayout;