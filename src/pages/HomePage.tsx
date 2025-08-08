import React from 'react';

interface props {
    isSignedIn: boolean | undefined;
}

const HomePage = ({isSignedIn}: props) => {


    return (
        <div>
            {isSignedIn}
        </div>
    );
};

export default HomePage;