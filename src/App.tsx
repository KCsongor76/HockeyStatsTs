import React, {useEffect, useState, useMemo} from "react";
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import "./App.css";
import {onAuthStateChanged} from "firebase/auth";
import RootLayout from "./components/RootLayout";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/HomePage";
import StartPage from "./pages/StartPage";
import GamePage from "./pages/GamePage";
import AuthPage from "./pages/AuthPage";
import SavedGamesPage from "./pages/SavedGamesPage";
import SavedGameDetailPage from "./pages/SavedGameDetailPage";
import TeamCRUDPage from "./pages/TeamCRUDPage";
import CreateTeamPage from "./pages/CreateTeamPage";
import HandleTeamPage from "./pages/HandleTeamPage";
import PlayerCRUDPage from "./pages/PlayerCRUDPage";
import CreatePlayerPage from "./pages/CreatePlayerPage";
import TransferPlayerPage from "./pages/TransferPlayerPage";
import HandlePlayerPage from "./pages/HandlePlayerPage";
import {loader as teamCRUDPageLoader} from "./pages/TeamCRUDPage2";
import {loader as playerCRUDPageLoader} from "./pages/PlayerCRUDPage";
import {loader as startPageLoader} from "./pages/StartPage";
import {loader as handleTeamPageLoader} from "./pages/HandleTeamPage2";
import {adminUids} from "./admin";
import {auth} from "./firebase";
import {
    ADMIN,
    CREATE,
    GAME,
    HANDLE_PLAYERS,
    HANDLE_TEAMS,
    ID,
    SAVED_GAMES,
    SAVED_GAMES_GAME_ID,
    START, TRANSFER_ID
} from "./OOP/constants/NavigationNames";
import LoadingSpinner from "./components/LoadingSpinner";
import TeamCrudPage2 from "./pages/TeamCRUDPage2";
import EditTeamPage from "./pages/EditTeamPage";
import HandleTeamPage2 from "./pages/HandleTeamPage2";

function App() {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Verify if user is admin
                const isAdmin = adminUids.includes(user.uid);
                setIsSignedIn(isAdmin);

                // Redirect non-admin users home
                if (!isAdmin && window.location.pathname.startsWith(`/${ADMIN}`)) {
                    window.location.href = '/';
                }
            } else {
                setIsSignedIn(false);
            }
            setIsLoaded(true);
        });

        return () => unsubscribe();
    }, []);

    const adminRoutes = [
        {
            path: "/",
            element: <RootLayout isSignedIn={isSignedIn}/>,
            errorElement: <ErrorPage/>,
            children: [
                {index: true, element: <HomePage isSignedIn={isSignedIn}/>},
                {path: START, element: <StartPage/>, loader: startPageLoader},
                {path: GAME, element: <GamePage/>},
                {path: SAVED_GAMES, element: <SavedGamesPage showFilters={true}/>},
                {path: SAVED_GAMES_GAME_ID, element: <SavedGameDetailPage/>},
                {
                    path: HANDLE_TEAMS,
                    children: [
                        {index: true, element: <TeamCrudPage2/>, loader: teamCRUDPageLoader},
                        {path: CREATE, element: <CreateTeamPage/>,},
                        {path: ID, element: <HandleTeamPage2/>, loader: handleTeamPageLoader},
                        {path: `${ID}/edit`, element: <EditTeamPage/>},
                    ],
                },
                {
                    path: HANDLE_PLAYERS,
                    children: [
                        {index: true, element: <PlayerCRUDPage/>, loader: playerCRUDPageLoader},
                        {path: CREATE, element: <CreatePlayerPage/>},
                        {path: ID, element: <HandlePlayerPage/>},
                        {path: TRANSFER_ID, element: <TransferPlayerPage/>},
                    ],
                },
                {path: ADMIN, element: <Navigate to="/" replace/>}
            ],
        },
    ];

    const placeholderRoutes = [
        {
            path: "*",
            element: <LoadingSpinner/>,
            errorElement: <ErrorPage/>,
        },
    ];

    const normalRoutes = [
        {
            path: "/",
            element: <RootLayout isSignedIn={isSignedIn}/>,
            errorElement: <ErrorPage/>,
            children: [
                {index: true, element: <HomePage isSignedIn={isSignedIn}/>},
                {path: START, element: <StartPage/>, loader: startPageLoader},
                {path: GAME, element: <GamePage/>},
                {path: SAVED_GAMES, element: <SavedGamesPage showFilters={true}/>},
                {path: SAVED_GAMES_GAME_ID, element: <SavedGameDetailPage/>},
                {path: ADMIN, element: <AuthPage/>},
                {path: "*", element: <Navigate to="/admin" replace/>}, // Redirect unauthorized users
            ]
        }
    ]

    const router = useMemo(() => {
        return createBrowserRouter(
            isLoaded ? (isSignedIn ? adminRoutes : normalRoutes) : placeholderRoutes
        );
    }, [isLoaded, isSignedIn]); // Only re-create router when auth state changes

    return <RouterProvider router={router}/>;
}

export default App;
