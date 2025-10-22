import React, {useEffect, useState} from "react";
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
import {loader as teamCRUDPageLoader} from "./pages/TeamCRUDPage";
import {loader as playerCRUDPageLoader} from "./pages/PlayerCRUDPage";
import {loader as startPageLoader} from "./pages/StartPage";
import {TeamService} from "./OOP/services/TeamService";
import {adminUids} from "./admin";
import {auth} from "./firebase";

// todo: add placeholder player to every team
// todo: clear all games - be aware for older apps of mine
// todo: fix championship enum logic? (clears with only new games?)

function App() {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Verify if user is admin
                const isAdmin = adminUids.includes(user.uid);
                setIsSignedIn(isAdmin);

                // Redirect non-admin users to home
                if (!isAdmin && window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/';
                }
            } else {
                setIsSignedIn(false);
            }
            setIsLoaded(true);
        });

        return () => unsubscribe();
    }, []);

    TeamService.createFreeAgentTeamIfNotExists()

    const adminRoutes = [
        {
            path: "/",
            element: <RootLayout isSignedIn={isSignedIn}/>,
            errorElement: <ErrorPage/>,
            children: [
                {index: true, element: <HomePage isSignedIn={isSignedIn}/>},
                {path: "start", element: <StartPage/>, loader: startPageLoader},
                {path: "game", element: <GamePage/>},
                {path: "previous_games", element: <SavedGamesPage showFilters={true}/>},
                {path: "previous_games/:gameId", element: <SavedGameDetailPage/>},
                {
                    path: "handleTeams",
                    children: [
                        {index: true, element: <TeamCRUDPage/>, loader: teamCRUDPageLoader},
                        {path: "create", element: <CreateTeamPage/>,},
                        {path: ":id", element: <HandleTeamPage/>},
                    ],
                },
                {
                    path: "handlePlayers",
                    children: [
                        {index: true, element: <PlayerCRUDPage/>, loader: playerCRUDPageLoader},
                        {path: "create", element: <CreatePlayerPage/>},
                        {path: ":id", element: <HandlePlayerPage/>},
                        {path: "transfer/:id", element: <TransferPlayerPage/>},
                    ],
                },
                {path: "admin", element: <Navigate to="/" replace/>}
            ],
        },
    ];

    const placeholderRoutes = [
        {
            path: "*",
            element: <p>Loading...</p>,
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
                {path: "start", element: <StartPage/>,},
                {path: "game", element: <GamePage/>},
                {path: "previous_games", element: <SavedGamesPage showFilters={true}/>},
                {path: "previous_games/:gameId", element: <SavedGameDetailPage/>},
                {path: "admin", element: <AuthPage/>},
                {path: "*", element: <Navigate to="/admin" replace/>}, // Redirect unauthorized users
            ]
        }
    ]

    const router = createBrowserRouter(
        isLoaded ? (isSignedIn ? adminRoutes : normalRoutes) : placeholderRoutes
    );

    return <RouterProvider router={router}/>;
}

export default App;
