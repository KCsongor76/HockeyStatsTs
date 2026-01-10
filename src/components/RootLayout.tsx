import React from 'react';
import {Outlet, useNavigation} from 'react-router-dom';
import MainNavigation from "./MainNavigation";
import LoadingSpinner from './LoadingSpinner';
import styles from './RootLayout.module.css';

interface props {
    isSignedIn: boolean | undefined;
}

const RootLayout = ({isSignedIn}: props) => {
    const navigation = useNavigation();

    return (
        <div className={styles.layout}>
            <MainNavigation isSignedIn={isSignedIn}/>
            <main className={styles.main}>
                {navigation.state === 'loading' && <LoadingSpinner overlay={true}/>}
                <Outlet/>
            </main>
        </div>
    );
};

export default RootLayout;