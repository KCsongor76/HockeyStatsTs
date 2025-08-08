import React from 'react';
import {Outlet} from 'react-router-dom';
import MainNavigation from "./MainNavigation";

interface props {
    isSignedIn: boolean | undefined;
}

const RootLayout = ({isSignedIn}: props) => {
    return (
        <div>
            <MainNavigation isSignedIn={isSignedIn}/>
            <main>
                <Outlet/>
            </main>
        </div>
    );
};

export default RootLayout;