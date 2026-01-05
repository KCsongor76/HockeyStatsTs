import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {useBlocker} from 'react-router-dom';
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {GameType} from "../OOP/enums/GameType";
import {RegularPeriod, PlayoffPeriod} from "../OOP/enums/Period";
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
import Button from "../components/Button";
import {START} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";

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

type SortField = 'type' | 'period' | 'time' | 'team' | 'player';
type SortDirection = 'asc' | 'desc';
type PlayerSortField = 'name' | 'jerseyNumber' | 'goals' | 'assists' | 'points' | 'shots' | 'hits' | 'turnovers' | 'shotPercentage';

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

    const [useDefaultHomeTeamColors, setUseDefaultHomeTeamColors] = useState<boolean>(false);
    const [useDefaultAwayTeamColors, setUseDefaultAwayTeamColors] = useState<boolean>(false);

    const [autosave, setAutosave] = useState(false);
    const navigate = useNavigate();
    const [isFinalizing, setIsFinalizing] = useState(false);
    const blocker = useBlocker(
        ({currentLocation, nextLocation}) =>
            !isFinalizing && actions.length > 0 && currentLocation.pathname !== nextLocation.pathname
    );

    const [sortField, setSortField] = useState<SortField>('period');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [playerSortField, setPlayerSortField] = useState<PlayerSortField>('points');
    const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('desc');

    const handleRinkClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSelectedPosition({x, y});
        setModalStep('action');
    };

    const getIconColors = (action: IGameAction) => {
        const isHomeTeam = action.team.id === currentGame?.teams.home.id;

        if (isHomeTeam && useDefaultHomeTeamColors) {
            // Default colors for the home team
            return {
                backgroundColor: gameSetup?.homeTeam?.homeColor?.primary,
                color: gameSetup?.homeTeam?.homeColor?.secondary
            };
        }

        if (!isHomeTeam && useDefaultAwayTeamColors) {
            // Default colors for the away team
            return {
                backgroundColor: gameSetup?.awayTeam?.homeColor?.primary,
                color: gameSetup?.awayTeam?.homeColor?.secondary
            };
        }

        // Use game colors
        return {
            backgroundColor: isHomeTeam
                ? gameSetup?.homeColors?.primary
                : gameSetup?.awayColors?.primary,
            color: isHomeTeam
                ? gameSetup?.homeColors?.secondary
                : gameSetup?.awayColors?.secondary
        };
    };

    const handleActionEdit = (action: IGameAction) => {
        setEditingAction(action); // Memorize the original action
        setCurrentAction(action); // Pre-populates the current action with existing data
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
                // Create mode: add the new action
                setActions(prev => [...prev, newAction]);
                updateScores(newAction);
            }

            // Auto-save if enabled
            if (autosave) {
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
                navigate(`/${START}`);
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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handlePlayerSort = (field: PlayerSortField) => {
        if (playerSortField === field) {
            setPlayerSortDirection(playerSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPlayerSortField(field);
            setPlayerSortDirection('asc');
        }
    };

    const getPeriodStartTime = (period: number): number => {
        if (!gameSetup) return 0;
        if (gameSetup.gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST: return 0;
                case RegularPeriod.SECOND: return 20 * 60;
                case RegularPeriod.THIRD: return 40 * 60;
                case RegularPeriod.OT: return 60 * 60;
                case RegularPeriod.SO: return 65 * 60;
                default: return (period - 1) * 20 * 60;
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST: return 0;
                case PlayoffPeriod.SECOND: return 20 * 60;
                case PlayoffPeriod.THIRD: return 40 * 60;
                default:
                    // Overtime periods: 60 minutes + (period - 3) * 20 minutes
                    return 60 * 60 + (period - PlayoffPeriod.THIRD) * 20 * 60;
            }
        }
    };

    const getTotalGameTime = (action: IGameAction): number => {
        const periodStart = getPeriodStartTime(action.period);
        return periodStart + action.time;
    };

    const formatGameTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getPeriodLabel = (period: number): string => {
        if (!gameSetup) return `${period}`;
        if (gameSetup.gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST: return '1st';
                case RegularPeriod.SECOND: return '2nd';
                case RegularPeriod.THIRD: return '3rd';
                case RegularPeriod.OT: return 'OT';
                case RegularPeriod.SO: return 'SO';
                default: return `${period}`;
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST: return '1st';
                case PlayoffPeriod.SECOND: return '2nd';
                case PlayoffPeriod.THIRD: return '3rd';
                default: return `OT${period - PlayoffPeriod.THIRD}`;
            }
        }
    };

    const getPeriodFilterLabel = (period: number): string => {
        if (gameSetup?.gameType === GameType.PLAYOFF) {
            return PlayoffPeriod[period] || period.toString();
        } else {
            return RegularPeriod[period] || period.toString();
        }
    };

    const sortedActions = [...actions].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortField) {
            case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
            case 'period':
                aValue = getTotalGameTime(a);
                bValue = getTotalGameTime(b);
                break;
            case 'time':
                aValue = getTotalGameTime(a);
                bValue = getTotalGameTime(b);
                break;
            case 'team':
                aValue = a.team.name;
                bValue = b.team.name;
                break;
            case 'player':
                aValue = a.player.name;
                bValue = b.player.name;
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const sortPlayers = (players: IPlayer[]) => {
        return [...players].sort((a, b) => {
            if (!currentGame) return 0;
            const statsA = Player.getPlayerStats([currentGame], a);
            const statsB = Player.getPlayerStats([currentGame], b);

            let valueA: any;
            let valueB: any;

            switch (playerSortField) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'jerseyNumber':
                    valueA = a.jerseyNumber;
                    valueB = b.jerseyNumber;
                    break;
                case 'goals':
                    valueA = statsA.goals || 0;
                    valueB = statsB.goals || 0;
                    break;
                case 'assists':
                    valueA = statsA.assists || 0;
                    valueB = statsB.assists || 0;
                    break;
                case 'points':
                    valueA = statsA.points || 0;
                    valueB = statsB.points || 0;
                    break;
                case 'shots':
                    valueA = statsA.shots || 0;
                    valueB = statsB.shots || 0;
                    break;
                case 'hits':
                    valueA = statsA.hits || 0;
                    valueB = statsB.hits || 0;
                    break;
                case 'turnovers':
                    valueA = statsA.turnovers || 0;
                    valueB = statsB.turnovers || 0;
                    break;
                case 'shotPercentage':
                    valueA = statsA.shotPercentage || 0;
                    valueB = statsB.shotPercentage || 0;
                    break;
                default:
                    return 0;
            }
            if (valueA < valueB) return playerSortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return playerSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const renderSortableHeader = (field: SortField, label: string) => (
        <th
            onClick={() => handleSort(field)}
            className={styles.sortableHeader}
        >
            {label}
            {sortField === field && (
                <span className={styles.sortIndicator}>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );

    const renderPlayerSortableHeader = (field: PlayerSortField, label: string) => (
        <th onClick={() => handlePlayerSort(field)} className={styles.sortableHeader}>
            {label}
            {playerSortField === field && (
                <span className={styles.sortIndicator}>{playerSortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );

    if (!gameSetup || !currentGame) {
        return <div>Loading game data...</div>;
    }

    return (
        <>
            <div className={styles.gameContainer}>
                <div className={styles.rinkContainer}>
                    <img
                        src={gameSetup.rinkImage}
                        alt="rink"
                        onClick={handleRinkClick}
                        className={styles.clickableRink}
                    />
                    {showDetails && <div className={styles.iconContainer}>
                        {actions.map((action, index) => {
                            const colors = getIconColors(action);
                            return (
                                <Icon
                                    key={index}
                                    actionType={action.type}
                                    backgroundColor={colors.backgroundColor ?? '#ffffff'}
                                    color={colors.color ?? '#000000'}
                                    x={action.x}
                                    y={action.y}
                                    onClick={() => handleIconClick(action)}
                                />
                            )
                        })}
                    </div>}
                </div>
            </div>

            {/*{currentGame && <GameScoreData game={currentGame} score={currentGame.score}/>}*/}

            {currentGame && <div className={styles.scoreContainer}>
                <div className={styles.scoreHeader}>
                    <div>
                        <p>Season: {currentGame.season}</p>
                        <p>Championship: {currentGame.championship}</p>
                        <p>Game type: {currentGame.type}</p>
                    </div>
                    <div className={styles.scoreValue}>
                        Score: {currentGame.score.home.goals} - {currentGame.score.away.goals}
                    </div>
                </div>

                <div className={styles.teamStats}>
                    <div className={styles.teamSection}>
                        <div className={styles.teamHeader}>
                            <img src={currentGame.teams?.home.logo} alt="home team" className={styles.teamLogo}/>
                            <h3>Home Team</h3>
                        </div>
                        <div className={styles.statItem}><span>Shots:</span> <span>{currentGame.score.home.shots}</span></div>
                        <div className={styles.statItem}><span>Turnovers:</span> <span>{currentGame.score.home.turnovers}</span></div>
                        <div className={styles.statItem}><span>Hits:</span> <span>{currentGame.score.home.hits}</span></div>
                    </div>

                    <div className={styles.teamSection}>
                        <div className={styles.teamHeader}>
                            <img src={currentGame.teams?.away.logo} alt="away team" className={styles.teamLogo}/>
                            <h3>Away Team</h3>
                        </div>
                        <div className={styles.statItem}><span>Shots:</span> <span>{currentGame.score.away.shots}</span></div>
                        <div className={styles.statItem}><span>Turnovers:</span> <span>{currentGame.score.away.turnovers}</span></div>
                        <div className={styles.statItem}><span>Hits:</span> <span>{currentGame.score.away.hits}</span></div>
                    </div>
                </div>
            </div>}

            <h3 style={{textAlign: 'center'}}>Game Controls</h3>
            <div style={
                {
                    display: "flex",
                    justifyContent: "center",
                }
            }>
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
                    {showDetails ? 'Hide Game Icons' : 'Show Game Icons'}
                </Button>
            </div>

            <h3 style={{textAlign: 'center'}}>Team Filters</h3>
            {/*<TeamFilters teamView={teamView} setTeamView={setTeamView}/>*/}
            <div className={styles.filterContainer}>
                <Button
                    styleType={"neutral"}
                    type="button"
                    className={teamView === 'all' ? styles.activeButton : ''}
                    onClick={() => setTeamView('all')}
                >
                    All Teams
                </Button>
                <Button
                    styleType={"neutral"}
                    type="button"
                    className={teamView === 'home' ? styles.activeButton : ''}
                    onClick={() => setTeamView('home')}
                >
                    Home Team
                </Button>
                <Button
                    styleType={"neutral"}
                    type="button"
                    className={teamView === 'away' ? styles.activeButton : ''}
                    onClick={() => setTeamView('away')}
                >
                    Away Team
                </Button>
            </div>

            <h3 style={{textAlign: 'center'}}>Color Selectors</h3>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Button
                    styleType={useDefaultHomeTeamColors ? 'positive' : 'neutral'}
                    onClick={() => setUseDefaultHomeTeamColors(!useDefaultHomeTeamColors)}
                >
                    {useDefaultHomeTeamColors ? 'Home-currently: Default Colors' : 'Home-currently: Game Colors'}
                </Button>

                <Button
                    styleType={useDefaultAwayTeamColors ? 'positive' : 'neutral'}
                    onClick={() => setUseDefaultAwayTeamColors(!useDefaultAwayTeamColors)}
                >
                    {useDefaultAwayTeamColors ? 'Away-currently: Default Colors' : 'Away-currently: Game Colors'}
                </Button>
            </div>

            <h3 style={{textAlign: 'center'}}>Available Period Filters</h3>
            <div className={styles.filterContainer}>
                {availablePeriods.length > 0 ? availablePeriods.map(period => (
                    <Button
                        styleType={"neutral"}
                        key={period}
                        type="button"
                        className={selectedPeriods.includes(period) ? styles.activeButton : ''}
                        onClick={() => togglePeriod(period)}
                    >
                        {getPeriodFilterLabel(period)}
                    </Button>
                )) : <p>No available period data yet.</p>}
            </div>

            <h3 style={{textAlign: 'center'}}>Available Action Type Filters</h3>
            <div className={styles.filterContainer}>
                {availableActionTypes.length > 0 ? availableActionTypes.map(type => (
                    <Button
                        styleType={"neutral"}
                        key={type}
                        type="button"
                        className={selectedActionTypes.includes(type) ? styles.activeButton : ''}
                        onClick={() => toggleActionType(type)}
                    >
                        {type}
                    </Button>
                )) : <p>No available action type data yet.</p>}
            </div>

            <div className={styles.rinkContainer}>
                <img src={gameSetup.rinkImage} alt="rink"/>
                <div className={styles.iconContainer}>
                    {getFilteredActions().map((action, index) => {
                        const colors = getIconColors(action);
                        return <Icon
                            key={`second-${index}`}
                            actionType={action.type}
                            backgroundColor={colors.backgroundColor ?? '#ffffff'}
                            color={colors.color ?? '#000000'}
                            x={action.x}
                            y={action.y}
                            onClick={() => handleIconClick(action)}
                        />
                    })}
                </div>
            </div>

            <h3 style={{textAlign: 'center'}}>Skaters</h3>
            {currentGame && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            {renderPlayerSortableHeader('name', 'Name')}
                            {renderPlayerSortableHeader('jerseyNumber', '#')}
                            {renderPlayerSortableHeader('goals', 'G')}
                            {renderPlayerSortableHeader('assists', 'A')}
                            {renderPlayerSortableHeader('points', 'P')}
                            {renderPlayerSortableHeader('shots', 'S')}
                            {renderPlayerSortableHeader('hits', 'H')}
                            {renderPlayerSortableHeader('turnovers', 'T')}
                            {renderPlayerSortableHeader('shotPercentage', 'S%')}
                        </tr>
                        </thead>
                        <tbody>
                        {sortPlayers(getFilteredPlayers().filter(p => p.position !== Position.GOALIE)).map(player => (
                            <tr
                                key={player.id}
                                className={selectedPlayer === player.id ? styles.selectedRow : ''}
                                onClick={() => togglePlayer(player.id)}
                            >
                                <td>{player.name}</td>
                                <td>{player.jerseyNumber}</td>
                                <td>{Player.getPlayerStats([currentGame], player).goals}</td>
                                <td>{Player.getPlayerStats([currentGame], player).assists}</td>
                                <td>{Player.getPlayerStats([currentGame], player).points}</td>
                                <td>{Player.getPlayerStats([currentGame], player).shots}</td>
                                <td>{Player.getPlayerStats([currentGame], player).hits}</td>
                                <td>{Player.getPlayerStats([currentGame], player).turnovers}</td>
                                <td>{Player.getPlayerStats([currentGame], player).shotPercentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h3 style={{textAlign: 'center'}}>Goalies</h3>
            {currentGame && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            {renderPlayerSortableHeader('name', 'Name')}
                            {renderPlayerSortableHeader('jerseyNumber', '#')}
                            {renderPlayerSortableHeader('goals', 'G')}
                            {renderPlayerSortableHeader('assists', 'A')}
                            {renderPlayerSortableHeader('points', 'P')}
                            {renderPlayerSortableHeader('shots', 'S')}
                            {renderPlayerSortableHeader('hits', 'H')}
                            {renderPlayerSortableHeader('turnovers', 'T')}
                            {renderPlayerSortableHeader('shotPercentage', 'S%')}
                        </tr>
                        </thead>
                        <tbody>
                        {sortPlayers(getFilteredPlayers().filter(p => p.position === Position.GOALIE)).map(player => (
                            <tr
                                key={player.id}
                                className={selectedPlayer === player.id ? styles.selectedRow : ''}
                                onClick={() => togglePlayer(player.id)}
                            >
                                <td>{player.name}</td>
                                <td>{player.jerseyNumber}</td>
                                <td>{Player.getPlayerStats([currentGame], player).goals}</td>
                                <td>{Player.getPlayerStats([currentGame], player).assists}</td>
                                <td>{Player.getPlayerStats([currentGame], player).points}</td>
                                <td>{Player.getPlayerStats([currentGame], player).shots}</td>
                                <td>{Player.getPlayerStats([currentGame], player).hits}</td>
                                <td>{Player.getPlayerStats([currentGame], player).turnovers}</td>
                                <td>{Player.getPlayerStats([currentGame], player).shotPercentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.tableContainer}>
                <h3>All Actions</h3>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        {renderSortableHeader('type', 'Type')}
                        {renderSortableHeader('period', 'Period')}
                        {renderSortableHeader('time', 'Time')}
                        {renderSortableHeader('team', 'Team')}
                        {renderSortableHeader('player', 'Player')}
                        <th>Assists</th>
                        <th>View</th>
                        <th>Delete</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedActions.map((action, index) => (
                        <tr key={index}>
                            <td>{action.type}</td>
                            <td>{getPeriodLabel(action.period)}</td>
                            <td>{formatGameTime(getTotalGameTime(action))}</td>
                            <td>{action.team.name}</td>
                            <td>#{action.player.jerseyNumber} {action.player.name}</td>
                            <td>
                                {action.assists && action.assists.length > 0
                                    ? action.assists.map(a => `#${a.jerseyNumber} ${a.name}`).join(', ')
                                    : '-'
                                }
                            </td>
                            <td>
                                <Button
                                    styleType="neutral"
                                    onClick={() => handleActionEdit(action)}
                                >
                                    View
                                </Button>
                            </td>
                            <td>
                                <Button
                                    styleType="negative"
                                    onClick={() => handleActionDelete(action)}
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <ActionSelectorModal
                isOpen={modalStep === 'action'}
                onClose={resetModalFlow}
                onSelect={handleActionSelect}
                homeTeam={gameSetup.homeTeam}
                awayTeam={gameSetup.awayTeam}
                homeColors={useDefaultHomeTeamColors ? gameSetup.homeTeam.homeColor : gameSetup.homeColors}
                awayColors={useDefaultAwayTeamColors ? gameSetup.awayTeam.homeColor : gameSetup.awayColors}
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