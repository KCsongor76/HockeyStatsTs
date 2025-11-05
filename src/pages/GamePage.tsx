import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {useBlocker} from 'react-router-dom';
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {GameType} from "../OOP/enums/GameType";
import {ITeam} from "../OOP/interfaces/ITeam";
import styles from "./GamePage.module.css";
import ActionSelectorModal from "../modals/ActionSelectorModal";
import {IGameAction} from "../OOP/interfaces/IGameAction";
import {ActionType} from "../OOP/enums/ActionType";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import Icon from "../components/Icon";
import ConfirmationModal from "../modals/ConfirmationModal";
import AssistSelectorModal from "../modals/AssistSelectorModal";
import PlayerSelectorModal from "../modals/PlayerSelectorModal";
import {IScoreData} from "../OOP/interfaces/IScoreData";
import {Position} from "../OOP/enums/Position";
import ActionDetailsModal from "../modals/ActionDetailsModal";
import {IGame} from "../OOP/interfaces/IGame";
import {GameService} from "../OOP/services/GameService";
import PlayerTable from "../components/PlayerTable";
import Button from "../components/Button";
import GameScoreData from "../components/GameScoreData";
import TeamFilters from "../components/TeamFilters";
import PeriodFilters from "../components/PeriodFilters";
import ActionTypeFilters from "../components/ActionTypeFilters";
import ActionsTable from "../components/ActionsTable";

interface GameSetup {
    season: Season;
    championship: Championship;
    gameType: GameType;
    rinkImage: string;
    homeTeam: ITeam;
    awayTeam: ITeam;
    homeColors: { primary: string; secondary: string };
    awayColors: { primary: string; secondary: string };
}

const GamePage = () => {
    const location = useLocation();
    const [gameSetup, setGameSetup] = useState<GameSetup | null>(null);
    const [currentGame, setCurrentGame] = useState<IGame | null>(null);
    const [homeScore, setHomeScore] = useState<IScoreData>({goals: 0, shots: 0, turnovers: 0, hits: 0});
    const [awayScore, setAwayScore] = useState<IScoreData>({goals: 0, shots: 0, turnovers: 0, hits: 0});
    const [actions, setActions] = useState<IGameAction[]>([]);
    const [showDetails, setShowDetails] = useState(true);
    const [modalStep, setModalStep] = useState<'action' | 'player' | 'assist' | 'confirm' | null>(null);
    const [editingAction, setEditingAction] = useState<IGameAction | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<{ x: number, y: number } | null>(null);
    const [currentAction, setCurrentAction] = useState<{
        type?: ActionType,
        team?: ITeam,
        player?: IPlayer,
        assists?: IPlayer[],
        period?: number,
        time?: number
    }>({});

    const [teamView, setTeamView] = useState<'all' | 'home' | 'away'>('all');
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [selectedActionTypes, setSelectedActionTypes] = useState<ActionType[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<IGameAction | null>(null); // New state for action details

    const [useHomeTeamColors, setUseHomeTeamColors] = useState<boolean>(true);
    const [useAwayTeamColors, setUseAwayTeamColors] = useState<boolean>(true);

    const [autosave, setAutosave] = useState(false);
    const navigate = useNavigate();
    const [isFinalizing, setIsFinalizing] = useState(false);
    const blocker = useBlocker(
        ({currentLocation, nextLocation}) =>
            !isFinalizing && actions.length > 0 && currentLocation.pathname !== nextLocation.pathname
    );

    const handleRinkClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSelectedPosition({x, y});
        setModalStep('action');
    };

    const getIconColors = (action: IGameAction) => {
        const isHomeTeam = action.team.id === currentGame?.teams.home.id;

        if (isHomeTeam && !useHomeTeamColors) {
            // Default colors for home team
            return {
                backgroundColor: currentGame?.colors.home.primary,
                color: currentGame?.colors.home.secondary
            };
        }

        if (!isHomeTeam && !useAwayTeamColors) {
            // Default colors for away team
            return {
                backgroundColor: currentGame?.colors.away.primary,
                color: currentGame?.colors.away.secondary
            };
        }

        // Use game colors
        return {
            backgroundColor: isHomeTeam
                ? currentGame?.teams.home.homeColor.primary
                : currentGame?.teams.away.awayColor.primary,
            color: isHomeTeam
                ? currentGame?.teams.home.homeColor.secondary
                : currentGame?.teams.away.awayColor.secondary
        };
    };

    const handleActionEdit = (action: IGameAction) => {
        setEditingAction(action); // Memorize the original action
        setCurrentAction(action); // Pre-populate the current action with existing data
        setSelectedPosition({x: action.x, y: action.y});
        setModalStep("confirm");
    };

    const handleActionDelete = (actionToDelete: IGameAction) => {
        if (window.confirm('Are you sure you want to delete this action?')) {
            setActions(prev => prev.filter(action => action !== actionToDelete));
            updateScoresOnDelete(actionToDelete);

            // Auto-save if enabled
            if (autosave) {
                saveGameToLocalStorage();
            }
        }
    };

    const updateScoresOnDelete = (action: IGameAction) => {
        if (!gameSetup) return;

        const updateScore = (setter: React.Dispatch<React.SetStateAction<IScoreData>>) => {
            setter(prev => ({
                goals: prev.goals - (action.type === ActionType.GOAL ? 1 : 0),
                shots: prev.shots - ([ActionType.SHOT, ActionType.GOAL].includes(action.type) ? 1 : 0),
                turnovers: prev.turnovers - (action.type === ActionType.TURNOVER ? 1 : 0),
                hits: prev.hits - (action.type === ActionType.HIT ? 1 : 0),
            }));
        };

        if (action.team.id === gameSetup.homeTeam.id) {
            updateScore(setHomeScore);
        } else {
            updateScore(setAwayScore);
        }
    };

    const recalculateScores = () => {
        if (!gameSetup) return;

        const newHomeScore: IScoreData = {goals: 0, shots: 0, turnovers: 0, hits: 0};
        const newAwayScore: IScoreData = {goals: 0, shots: 0, turnovers: 0, hits: 0};

        actions.forEach(action => {
            const score = action.team.id === gameSetup.homeTeam.id ? newHomeScore : newAwayScore;
            score.goals += action.type === ActionType.GOAL ? 1 : 0;
            score.shots += [ActionType.SHOT, ActionType.GOAL].includes(action.type) ? 1 : 0;
            score.turnovers += action.type === ActionType.TURNOVER ? 1 : 0;
            score.hits += action.type === ActionType.HIT ? 1 : 0;
        });

        setHomeScore(newHomeScore);
        setAwayScore(newAwayScore);
    };

    const saveGameToLocalStorage = () => {
        if (!gameSetup) return;

        const gameState = {
            homeScore,
            awayScore,
            actions,
            setup: gameSetup
        };
        // No alert or confirm - silent save
        localStorage.setItem('unfinishedGame', JSON.stringify(gameState));
    };

    // Toggle function for the autosave button
    const toggleAutosave = () => {
        const newAutosaveState = !autosave;
        setAutosave(newAutosaveState);

        // If turning autosave on, save immediately
        if (newAutosaveState) {
            saveGameToLocalStorage();
        }
    };

    const handleActionSelect = (type: ActionType, team: ITeam, period: number, time: number) => {
        setCurrentAction(prev => ({...prev, type, team, period, time}));
        setModalStep('player');
    };

    const handlePlayerSelect = (player: IPlayer) => {
        if (currentAction.type === ActionType.GOAL) {
            setModalStep('assist');
        } else {
            setModalStep('confirm');
        }
        setCurrentAction(prev => ({...prev, player}));
    };

    const handleAssistSelect = (assists: IPlayer[]) => {
        setCurrentAction(prev => ({...prev, assists}));
        setModalStep('confirm');
    };

    const goBackToActionSelector = () => {
        setModalStep('action');
        // Remove player and assists fields when going back to action selector
        setCurrentAction(prev => {
            const {player, assists, ...rest} = prev;
            return rest;
        });
    };

    const goBackToPlayerSelector = () => {
        setModalStep('player');
        // Remove player and assists fields when going back to player selector
        setCurrentAction(prev => {
            const {player, assists, ...rest} = prev;
            return rest;
        });
    };

    const goBackToAssistSelector = () => {
        // Remove assists field when going back to assist selector
        setCurrentAction(prev => {
            const {assists, ...rest} = prev;
            return rest;
        });
        setModalStep('assist');
    };

    const updateScores = (action: IGameAction) => {
        if (!gameSetup) return;

        const updateScore = (setter: React.Dispatch<React.SetStateAction<IScoreData>>) => {
            setter(prev => ({
                goals: prev.goals + (action.type === ActionType.GOAL ? 1 : 0),
                shots: prev.shots + ([ActionType.SHOT, ActionType.GOAL].includes(action.type) ? 1 : 0),
                turnovers: prev.turnovers + (action.type === ActionType.TURNOVER ? 1 : 0),
                hits: prev.hits + (action.type === ActionType.HIT ? 1 : 0),
            }));
        };

        if (action.team.id === gameSetup.homeTeam.id) {
            updateScore(setHomeScore);
        } else {
            updateScore(setAwayScore);
        }
    };

    const getAvailablePeriods = () => {
        const availablePeriods = new Set<number>();
        actions.forEach(action => {
            availablePeriods.add(action.period);
        })
        const periodsArray: number[] = [];
        availablePeriods.forEach((period) => {
            periodsArray.push(period);
        })
        return periodsArray;
    }

    const getAvailableActionTypes = () => {
        const availableActionTypes = new Set<ActionType>();
        actions.forEach(action => {
            availableActionTypes.add(action.type);
        })
        const actionTypesArray: ActionType[] = [];
        availableActionTypes.forEach((actionType) => {
            actionTypesArray.push(actionType);
        })
        return actionTypesArray;
    }

    const availablePeriods = getAvailablePeriods();
    const availableActionTypes = getAvailableActionTypes();

    const getFilteredPlayers = () => {
        if (!gameSetup) return [];

        const allPlayers = [...gameSetup.homeTeam.roster, ...gameSetup.awayTeam.roster] as IPlayer[];
        if (teamView === "home") {
            return gameSetup.homeTeam.roster as IPlayer[] || [];
        } else if (teamView === "away") {
            return gameSetup.awayTeam.roster as IPlayer[] || [];
        }
        return allPlayers;
    }

    const getFilteredActions = () => {
        if (!gameSetup) return [];

        return actions.filter(action => {
            if (teamView === 'home' && action.team.id !== gameSetup.homeTeam.id) return false;
            if (teamView === 'away' && action.team.id !== gameSetup.awayTeam.id) return false;
            if (selectedPeriods.length > 0 && !selectedPeriods.includes(action.period)) return false;
            if (selectedActionTypes.length > 0 && !selectedActionTypes.includes(action.type)) return false;
            if (selectedPlayer) {
                if (action.player.id !== selectedPlayer) {
                    // For goals, check assists too
                    if (action.type !== ActionType.GOAL ||
                        !action.assists?.some(a => a.id === selectedPlayer)) {
                        return false;
                    }
                }
            }
            return true;
        });
    };

    // Toggle period selection
    const togglePeriod = (period: number) => {
        setSelectedPeriods(prev =>
            prev.includes(period)
                ? prev.filter(p => p !== period)
                : [...prev, period]
        );
    };

    // Toggle action type selection
    const toggleActionType = (type: ActionType) => {
        setSelectedActionTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // Toggle player selection
    const togglePlayer = (playerId: string) => {
        setSelectedPlayer(prev =>
            prev === playerId ? null : playerId
        );
    };

    const resetModalFlow = () => {
        setModalStep(null);
        setSelectedPosition(null);
        setCurrentAction({});
    };

    const handleIconClick = (action: IGameAction) => {
        setSelectedAction(action);
    };

    const confirmAction = () => {
        if (selectedPosition && currentAction.type && currentAction.team && currentAction.player) {
            const newAction: IGameAction = {
                type: currentAction.type,
                team: currentAction.team,
                player: currentAction.player,
                period: currentAction.period || 1,
                time: currentAction.time || 0,
                x: selectedPosition.x,
                y: selectedPosition.y,
                assists: currentAction.assists ?? []
            };

            if (editingAction) {
                // Update mode: remove the old action and add the new one
                setActions(prev => prev.filter(action => action !== editingAction).concat(newAction));
                // Recalculate scores since the action might have changed type/team
                recalculateScores();
            } else {
                // Create mode: just add the new action
                setActions(prev => [...prev, newAction]);
                updateScores(newAction);
            }

            // Auto-save if enabled
            if (autosave) {
                console.log(autosave, "autosave run")
                saveGameToLocalStorage();
            }
        }

        // Reset everything
        resetModalFlow();
        setEditingAction(null);
    };

    const saveGameLocally = () => {
        if (!gameSetup) return;

        if (window.confirm('Save current game? This will overwrite any previously saved game.')) {
            const gameState = {
                homeScore,
                awayScore,
                actions,
                setup: gameSetup
            };
            localStorage.setItem('unfinishedGame', JSON.stringify(gameState));
            alert('Game saved successfully!');
        }
    };

    const finalizeGame = async () => {
        if (!gameSetup) return;
        if (currentGame?.score?.home?.goals === currentGame?.score?.away?.goals) {
            alert("Can't finalize a tie game!")
            return
        }
        const confirmMessage = 'Are you sure you want to finalize the game? This action cannot be undone and you will be redirected to the start page.';

        if (window.confirm(confirmMessage)) {
            setIsFinalizing(true); // Set this to true before navigation
            try {
                const gameData: IGame = {
                    id: '', // Will be generated by Firebase
                    type: gameSetup.gameType,
                    season: gameSetup.season,
                    championship: gameSetup.championship,
                    actions: actions,
                    timestamp: new Date().toISOString(),
                    score: {home: homeScore, away: awayScore},
                    colors: {home: gameSetup.homeColors, away: gameSetup.awayColors},
                    teams: {
                        home: gameSetup.homeTeam,
                        away: gameSetup.awayTeam
                    },
                    selectedImage: gameSetup.rinkImage
                };

                await GameService.saveGame(gameData);
                localStorage.removeItem('unfinishedGame');
                alert('Game finalized successfully!');
                navigate('/start');
            } catch (error) {
                console.error('Failed to save game', error);
                alert('Failed to save game. See console for details.');
                setIsFinalizing(false); // Reset if there's an error
            }
        }
    };

    useEffect(() => {
        // First check localStorage for saved game
        const savedGame = localStorage.getItem('unfinishedGame');
        if (savedGame) {
            try {
                const parsed = JSON.parse(savedGame);
                setGameSetup(parsed.setup);
                setHomeScore(parsed.homeScore);
                setAwayScore(parsed.awayScore);
                setActions(parsed.actions);
                return; // Exit early if we loaded from localStorage
            } catch (err) {
                console.error("Failed to parse saved game", err);
            }
        }

        // Then check location state
        const locationState = location.state;
        if (locationState) {
            if ('setup' in locationState) {
                setGameSetup(locationState.setup);
                setHomeScore(locationState.homeScore);
                setAwayScore(locationState.awayScore);
                setActions(locationState.actions);
            } else {
                setGameSetup(locationState as GameSetup);
            }
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (gameSetup) {
            setCurrentGame({
                id: '',
                type: gameSetup.gameType,
                season: gameSetup.season,
                championship: gameSetup.championship,
                actions: actions,
                timestamp: new Date().toISOString(),
                score: {home: homeScore, away: awayScore},
                teams: {
                    home: gameSetup.homeTeam,
                    away: gameSetup.awayTeam
                },
                colors: {home: gameSetup.homeColors, away: gameSetup.awayColors},
                selectedImage: gameSetup.rinkImage
            });
        }
    }, [gameSetup, actions, homeScore, awayScore]);

    useEffect(() => {
        if (blocker.state === "blocked") {
            if (window.confirm('You have unsaved game data. Are you sure you want to leave? Your progress will be lost.')) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    // Keep the existing beforeunload and popstate handlers for browser navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (actions.length > 0) {
                e.preventDefault();
                e.returnValue = 'You have unsaved game data. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        const handlePopState = (e: PopStateEvent) => {
            if (actions.length > 0) {
                if (!window.confirm('You have unsaved game data. Are you sure you want to leave? Your progress will be lost.')) {
                    // Push the current state back if user cancels
                    window.history.pushState(null, '', window.location.pathname);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [actions.length]);

    useEffect(() => {
        saveGameToLocalStorage();
    }, [actions, autosave]);

    if (!gameSetup) {
        return <div>Loading game data...</div>;
    }

    return (
        <>
            <div className={styles.gameContainer}>

                {/* First rink with clickable area */}
                <div className={styles.rinkContainer}>
                    <img
                        src={gameSetup.rinkImage}
                        alt="rink"
                        onClick={handleRinkClick}
                        className={styles.clickableRink}
                    />
                    {showDetails && <div className={styles.iconContainer}>
                        {actions.map((action, index) => {
                            // todo:
                            const colors = getIconColors(action);
                            return (
                            <Icon
                                key={index}
                                actionType={action.type}
                                backgroundColor={action.team.id === gameSetup.homeTeam.id ? gameSetup.homeColors.primary : gameSetup.awayColors.primary}
                                color={action.team.id === gameSetup.homeTeam.id ? gameSetup.homeColors.secondary : gameSetup.awayColors.secondary}
                                x={action.x}
                                y={action.y}
                                onClick={() => handleIconClick(action)}
                            />
                        )
                        })}
                    </div>}
                </div>

                {currentGame && <GameScoreData game={currentGame} score={currentGame.score}/>}

                <div>
                    <Button styleType={"positive"} type="button" onClick={saveGameLocally}>
                        Save Game Locally
                    </Button>

                    <Button
                        styleType={autosave ? "positive" : "negative"}
                        onClick={toggleAutosave}
                    >
                        Autosave: {autosave ? "ON" : "OFF"}
                    </Button>

                    <Button styleType={"positive"} type="button" onClick={finalizeGame}>
                        Finalize Game
                    </Button>

                    <Button
                        styleType={showDetails ? "negative" : "positive"}
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </Button>
                </div>
            </div>


            {showDetails && (
                <>
                    <div className={styles.gameContainer}>
                        <h3>Team View</h3>
                        <TeamFilters teamView={teamView} setTeamView={setTeamView}/>

                        <h3>Icon Colors</h3>
                        <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                            <div>
                                <Button
                                    styleType={useHomeTeamColors ? 'positive' : 'neutral'}
                                    onClick={() => setUseHomeTeamColors(!useHomeTeamColors)}
                                >
                                    {useHomeTeamColors ? 'Home-currently: Default Colors' : 'Home-currently: Game Colors'}
                                </Button>
                            </div>
                            <div>
                                <Button
                                    styleType={useAwayTeamColors ? 'positive' : 'neutral'}
                                    onClick={() => setUseAwayTeamColors(!useAwayTeamColors)}
                                >
                                    {useAwayTeamColors ? 'Away-currently: Default Colors' : 'Away-currently: Game Colors'}
                                </Button>
                            </div>
                        </div>

                        <h3>Periods</h3>
                        <PeriodFilters
                            availablePeriods={availablePeriods}
                            selectedPeriods={selectedPeriods}
                            togglePeriod={togglePeriod}
                            gameType={gameSetup.gameType}
                        />

                        <h3>Action Types</h3>
                        <ActionTypeFilters
                            availableActionTypes={availableActionTypes}
                            selectedActionTypes={selectedActionTypes}
                            toggleActionType={toggleActionType}
                        />
                    </div>

                    {/* Second rink */}
                    <div className={styles.rinkContainer}>
                        <img src={gameSetup.rinkImage} alt="rink"/>
                        <div className={styles.iconContainer}>
                            {getFilteredActions().map((action, index) => (
                                <Icon
                                    key={`second-${index}`}
                                    actionType={action.type}
                                    backgroundColor={action.team.id === gameSetup.homeTeam.id ? gameSetup.homeColors.primary : gameSetup.awayColors.primary}
                                    color={action.team.id === gameSetup.homeTeam.id ? gameSetup.homeColors.secondary : gameSetup.awayColors.secondary}
                                    x={action.x}
                                    y={action.y}
                                    onClick={() => handleIconClick(action)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.gameContainer}>
                        <h2>Player Statistics</h2>
                        <h3>Skaters</h3>
                        {currentGame && (
                            <PlayerTable
                                pageType="game"
                                players={getFilteredPlayers().filter(p => p.position !== Position.GOALIE)}
                                games={[currentGame]}
                                selectedPlayer={selectedPlayer}
                                togglePlayer={togglePlayer}
                            />
                        )}

                        <h3>Goalies</h3>
                        {currentGame && (
                            <PlayerTable
                                pageType="game"
                                players={getFilteredPlayers().filter(p => p.position === Position.GOALIE)}
                                games={[currentGame]}
                                selectedPlayer={selectedPlayer}
                                togglePlayer={togglePlayer}
                            />
                        )}
                    </div>

                    <ActionsTable
                        actions={actions}
                        gameType={gameSetup.gameType}
                        onActionEdit={handleActionEdit}
                        onActionDelete={handleActionDelete}
                    />

                </>
            )}

            <ActionSelectorModal
                isOpen={modalStep === 'action'}
                onClose={resetModalFlow}
                onSelect={handleActionSelect}
                homeTeam={gameSetup.homeTeam}
                awayTeam={gameSetup.awayTeam}
                homeColors={gameSetup.homeColors}
                awayColors={gameSetup.awayColors}
                gameType={gameSetup.gameType}
            />

            <PlayerSelectorModal
                isOpen={modalStep === 'player'}
                team={currentAction.team}
                onClose={resetModalFlow}
                onSelect={handlePlayerSelect}
                onGoBack={goBackToActionSelector}
            />

            <AssistSelectorModal
                isOpen={modalStep === 'assist'}
                team={currentAction.team}
                excludedPlayer={currentAction.player}
                onClose={resetModalFlow}
                onSelect={handleAssistSelect}
                onGoBack={goBackToPlayerSelector}
            />

            <ConfirmationModal
                isOpen={modalStep === 'confirm'}
                action={currentAction}
                position={selectedPosition}
                onClose={resetModalFlow}
                onConfirm={confirmAction}
                onGoBack={currentAction.type === ActionType.GOAL ? goBackToAssistSelector : goBackToPlayerSelector} // Add this
            />

            <ActionDetailsModal
                isOpen={!!selectedAction}
                onClose={() => setSelectedAction(null)}
                action={selectedAction}
            />
        </>
    );
};

export default GamePage;