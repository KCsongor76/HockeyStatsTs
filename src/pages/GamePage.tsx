import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {useBlocker} from 'react-router-dom';
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {GameType} from "../OOP/enums/GameType";
import {ITeam} from "../OOP/interfaces/ITeam";
import ActionSelectorModal from "../modals/ActionSelectorModal";
import {IGameAction} from "../OOP/interfaces/IGameAction";
import {ActionType} from "../OOP/enums/ActionType";
import {IPlayer} from "../OOP/interfaces/IPlayer";
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
import {GameUtils} from "../utils/GameUtils";
import GameHeader from "../components/game/GameHeader";
import InteractiveRink from "../components/game/InteractiveRink";
import GameControls from "../components/game/GameControls";
import {ActionTypeFilter, ColorSelector, PeriodFilter, TeamFilter} from "../components/game/GameFilters";
import RinkMap from "../components/game/RinkMap";
import ActionTable from "../components/game/ActionTable";
import PlayerStatsTable, {RosterPlayer} from "../components/tables/PlayerStatsTable";
import styles from "./GamePage.module.css";

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
type PlayerSortField =
    'name'
    | 'jerseyNumber'
    | 'goals'
    | 'assists'
    | 'points'
    | 'shots'
    | 'hits'
    | 'turnovers'
    | 'shotPercentage';

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
    const [selectedAction, setSelectedAction] = useState<IGameAction | null>(null);

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
            return {
                backgroundColor: gameSetup?.homeTeam?.homeColor?.primary,
                color: gameSetup?.homeTeam?.homeColor?.secondary
            };
        }

        if (!isHomeTeam && useDefaultAwayTeamColors) {
            return {
                backgroundColor: gameSetup?.awayTeam?.homeColor?.primary,
                color: gameSetup?.awayTeam?.homeColor?.secondary
            };
        }

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
        setEditingAction(action);
        setCurrentAction(action);
        setSelectedPosition({x: action.x, y: action.y});
        setModalStep("confirm");
    };

    const handleActionDelete = (actionToDelete: IGameAction) => {
        if (window.confirm('Are you sure you want to delete this action?')) {
            setActions(prev => prev.filter(action => action !== actionToDelete));
            updateScoresOnDelete(actionToDelete);

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
        localStorage.setItem('unfinishedGame', JSON.stringify(gameState));
    };

    const toggleAutosave = () => {
        const newAutosaveState = !autosave;
        setAutosave(newAutosaveState);

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
        setCurrentAction(prev => {
            const {player, assists, ...rest} = prev;
            return rest;
        });
    };

    const goBackToPlayerSelector = () => {
        setModalStep('player');
        setCurrentAction(prev => {
            const {player, assists, ...rest} = prev;
            return rest;
        });
    };

    const goBackToAssistSelector = () => {
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
        return Array.from(availablePeriods);
    }

    const getAvailableActionTypes = () => {
        const availableActionTypes = new Set<ActionType>();
        actions.forEach(action => {
            availableActionTypes.add(action.type);
        })
        return Array.from(availableActionTypes);
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
                    if (action.type !== ActionType.GOAL ||
                        !action.assists?.some(a => a.id === selectedPlayer)) {
                        return false;
                    }
                }
            }
            return true;
        });
    };

    const togglePeriod = (period: number) => {
        setSelectedPeriods(prev =>
            prev.includes(period)
                ? prev.filter(p => p !== period)
                : [...prev, period]
        );
    };

    const toggleActionType = (type: ActionType) => {
        setSelectedActionTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

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
                setActions(prev => prev.filter(action => action !== editingAction).concat(newAction));
                recalculateScores();
            } else {
                setActions(prev => [...prev, newAction]);
                updateScores(newAction);
            }

            if (autosave) {
                saveGameToLocalStorage();
            }
        }

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
            setIsFinalizing(true);
            try {
                const gameData: IGame = {
                    id: '',
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
                setIsFinalizing(false);
            }
        }
    };

    useEffect(() => {
        const savedGame = localStorage.getItem('unfinishedGame');
        if (savedGame) {
            try {
                const parsed = JSON.parse(savedGame);
                setGameSetup(parsed.setup);
                setHomeScore(parsed.homeScore);
                setAwayScore(parsed.awayScore);
                setActions(parsed.actions);
                return;
            } catch (err) {
                console.error("Failed to parse saved game", err);
            }
        }

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

    const handlePlayerSort = (field: any) => {
        if (playerSortField === field) {
            setPlayerSortDirection(playerSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPlayerSortField(field);
            setPlayerSortDirection('asc');
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
                aValue = GameUtils.getTotalGameTime(a, gameSetup?.gameType || GameType.REGULAR);
                bValue = GameUtils.getTotalGameTime(b, gameSetup?.gameType || GameType.REGULAR);
                break;
            case 'time':
                aValue = GameUtils.getTotalGameTime(a, gameSetup?.gameType || GameType.REGULAR);
                bValue = GameUtils.getTotalGameTime(b, gameSetup?.gameType || GameType.REGULAR);
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

    const mapToRosterPlayers = (players: IPlayer[]): RosterPlayer[] => {
        if (!currentGame) return [];
        return players.map(p => ({
            id: p.id,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            stats: Player.getPlayerStats([currentGame], p)
        })).sort((a, b) => {
            let valueA: any = a.stats[playerSortField as keyof typeof a.stats];
            let valueB: any = b.stats[playerSortField as keyof typeof b.stats];

            if (playerSortField === 'name') {
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
            } else if (playerSortField === 'jerseyNumber') {
                valueA = a.jerseyNumber;
                valueB = b.jerseyNumber;
            }

            if (valueA < valueB) return playerSortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return playerSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    if (!gameSetup || !currentGame) {
        return <div>Loading game data...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.scrollContainer}>
                <InteractiveRink
                    rinkImage={gameSetup.rinkImage}
                    actions={actions}
                    onRinkClick={handleRinkClick}
                    getIconColors={getIconColors}
                    onIconClick={handleIconClick}
                    showDetails={showDetails}
                />
            </div>

            <GameHeader game={currentGame}/>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Game Controls</h3>
            <GameControls
                onSaveLocally={saveGameLocally}
                autosave={autosave}
                onToggleAutosave={toggleAutosave}
                onFinalize={finalizeGame}
                showDetails={showDetails}
                onToggleDetails={() => setShowDetails(!showDetails)}
            />
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Team Filters</h3>
            <TeamFilter teamView={teamView} setTeamView={setTeamView}/>
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Color Selectors</h3>
            <ColorSelector
                useDefaultHome={useDefaultHomeTeamColors}
                setUseDefaultHome={setUseDefaultHomeTeamColors}
                useDefaultAway={useDefaultAwayTeamColors}
                setUseDefaultAway={setUseDefaultAwayTeamColors}
            />
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Available Period Filters</h3>
            <PeriodFilter
                availablePeriods={availablePeriods}
                selectedPeriods={selectedPeriods}
                togglePeriod={togglePeriod}
                gameType={gameSetup.gameType}
            />
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Available Action Type Filters</h3>
            <ActionTypeFilter
                availableActionTypes={availableActionTypes}
                selectedActionTypes={selectedActionTypes}
                toggleActionType={toggleActionType}
            />
            </div>

            <div className={styles.scrollContainer}>
                <RinkMap
                    rinkImage={gameSetup.rinkImage}
                    actions={getFilteredActions()}
                    getIconColors={getIconColors}
                    onIconClick={handleIconClick}
                />
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Skaters</h3>
            <div className={styles.tableSection}>
                <PlayerStatsTable
                    title=""
                    variant="roster"
                    players={mapToRosterPlayers(getFilteredPlayers().filter(p => p.position !== Position.GOALIE))}
                    sortConfig={{field: playerSortField, direction: playerSortDirection}}
                    onSort={handlePlayerSort}
                    onView={(id) => togglePlayer(id)}
                    selectedPlayerId={selectedPlayer}
                />
            </div>
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Goalies</h3>
            <div className={styles.tableSection}>
                <PlayerStatsTable
                    title=""
                    variant="roster"
                    players={mapToRosterPlayers(getFilteredPlayers().filter(p => p.position === Position.GOALIE))}
                    sortConfig={{field: playerSortField, direction: playerSortDirection}}
                    onSort={handlePlayerSort}
                    onView={(id) => togglePlayer(id)}
                    selectedPlayerId={selectedPlayer}
                />
            </div>
            </div>

            <div className={styles.scrollContainer}>
                <ActionTable
                    actions={sortedActions}
                    gameType={gameSetup.gameType}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onView={handleActionEdit}
                    onDelete={handleActionDelete}
                />
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
                onGoBack={currentAction.type === ActionType.GOAL ? goBackToAssistSelector : goBackToPlayerSelector}
            />

            <ActionDetailsModal
                isOpen={!!selectedAction}
                onClose={() => setSelectedAction(null)}
                action={selectedAction}
            />
        </div>
    );
};

export default GamePage;