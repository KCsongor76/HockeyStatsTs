import React from 'react';
import {Game} from "../OOP/classes/Game";

interface SavedGamesPageProps {
    playerGames?: Game[];
    showFilters?: boolean;
}

const SavedGamesPage2 = ({playerGames, showFilters}: SavedGamesPageProps) => {
    const games = playerGames ?? [] as Game[];

    return (
        <>
            {/*  todo: search home team  */}
            {/*  todo: search away team  */}
            {/*  todo: search championship  */}
            {/*  todo: search season  */}
            {/*  todo: search gametype  */}

        </>
    );
};

export default SavedGamesPage2;