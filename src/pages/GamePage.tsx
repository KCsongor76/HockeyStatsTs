import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
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
    const [homeScore, setHomeScore] = useState<IScoreData>({goals: 0, shots: 0, turnovers: 0, hits: 0});
    const [awayScore, setAwayScore] = useState<IScoreData>({goals: 0, shots: 0, turnovers: 0, hits: 0});
    const [actions, setActions] = useState<IGameAction[]>([]);
    const [showDetails, setShowDetails] = useState(true);
    const [modalStep, setModalStep] = useState<'action' | 'player' | 'assist' | 'confirm' | null>(null);
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
    const [skatersSortConfig, setSkatersSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [goaliesSortConfig, setGoaliesSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const navigate = useNavigate();

    const handleRinkClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSelectedPosition({x, y});
        setModalStep('action');
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

    const updateScores = (action: IGameAction) => {
        if (!gameSetup) return;

        if (action.team.id === gameSetup.homeTeam.id) {
            setHomeScore(prev => {
                const newScore = {goals: 0, shots: 0, turnovers: 0, hits: 0} as IScoreData;
                newScore.goals = prev.goals + (action.type === ActionType.GOAL ? 1 : 0);
                newScore.shots = prev.shots + ([ActionType.SHOT, ActionType.GOAL].includes(action.type) ? 1 : 0);
                newScore.turnovers = prev.turnovers + (action.type === ActionType.TURNOVER ? 1 : 0);
                newScore.hits = prev.hits + (action.type === ActionType.HIT ? 1 : 0);
                return newScore;
            });
        } else {
            setAwayScore(prev => {
                const newScore = {goals: 0, shots: 0, turnovers: 0, hits: 0} as IScoreData
                newScore.goals = prev.goals + (action.type === ActionType.GOAL ? 1 : 0);
                newScore.shots = prev.shots + ([ActionType.SHOT, ActionType.GOAL].includes(action.type) ? 1 : 0);
                newScore.turnovers = prev.turnovers + (action.type === ActionType.TURNOVER ? 1 : 0);
                newScore.hits = prev.hits + (action.type === ActionType.HIT ? 1 : 0);
                return newScore;
            });
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

    const getFilteredPlayers = () => {
        if (!gameSetup) return [];

        const allPlayers = [...gameSetup.homeTeam.players, ...gameSetup.awayTeam.players] as IPlayer[];
        if (teamView === "home") {
            return gameSetup.homeTeam.players as IPlayer[] || [];
        } else if (teamView === "away") {
            return gameSetup.awayTeam.players as IPlayer[] || [];
        }
        return allPlayers;
    }

    const getIndividualStats = (player: IPlayer) => {
        const name = player.name;
        const jerseyNumber = player.jerseyNumber;
        let goals = 0;
        let assists = 0;
        let shots = 0;
        let hits = 0;
        let turnovers = 0;

        actions.forEach(action => {
            if (action.player.id === player.id) {
                switch (action.type) {
                    case ActionType.GOAL:
                        goals++;
                        shots++;
                        break;
                    case ActionType.SHOT:
                        shots++;
                        break;
                    case ActionType.HIT:
                        hits++
                        break;
                    case ActionType.TURNOVER:
                        turnovers++
                        break;
                }
            } else {
                if (action.assists?.some(p => p.id === player.id)) {
                    assists++;
                }
            }
        })
        const points = goals + assists;
        let shotPercentage;
        if (player.position !== Position.GOALIE) {
            shotPercentage = shots > 0 ? goals / shots : 0;
        } else {
            if (gameSetup && player.teamId === gameSetup.homeTeam.id) {
                shotPercentage = (awayScore.shots - awayScore.goals) / awayScore.shots;
            } else if (gameSetup) {
                shotPercentage = (homeScore.shots - homeScore.goals) / homeScore.shots;
            } else {
                shotPercentage = 0;
            }
        }
        shotPercentage *= 100

        return {name, jerseyNumber, goals, assists, points, hits, turnovers, shots, shotPercentage}
    }

    const getFilteredActions = () => {
        if (!gameSetup) return [];

        return actions.filter(action => {
            // Team filter
            if (teamView === 'home' && action.team.id !== gameSetup.homeTeam.id) return false;
            if (teamView === 'away' && action.team.id !== gameSetup.awayTeam.id) return false;

            // Period filter
            if (selectedPeriods.length > 0 && !selectedPeriods.includes(action.period)) return false;

            // Action type filter
            if (selectedActionTypes.length > 0 && !selectedActionTypes.includes(action.type)) return false;

            // Player filter
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

    const getSortedSkaters = () => {
        const skaters = getFilteredPlayers().filter(p => p.position !== Position.GOALIE);
        if (!skatersSortConfig) return skaters;

        return [...skaters].sort((a, b) => {
            const statsA = getIndividualStats(a);
            const statsB = getIndividualStats(b);
            const key = skatersSortConfig.key as keyof typeof statsA;

            if (statsA[key] < statsB[key]) {
                return skatersSortConfig.direction === 'asc' ? -1 : 1;
            }
            if (statsA[key] > statsB[key]) {
                return skatersSortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Get sorted goalies
    const getSortedGoalies = () => {
        const goalies = getFilteredPlayers().filter(p => p.position === Position.GOALIE);
        if (!goaliesSortConfig) return goalies;

        return [...goalies].sort((a, b) => {
            const statsA = getIndividualStats(a);
            const statsB = getIndividualStats(b);
            const key = goaliesSortConfig.key as keyof typeof statsA;

            if (statsA[key] < statsB[key]) {
                return goaliesSortConfig.direction === 'asc' ? -1 : 1;
            }
            if (statsA[key] > statsB[key]) {
                return goaliesSortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
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

    // New sorting functions
    const handleSkatersSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (skatersSortConfig && skatersSortConfig.key === key && skatersSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSkatersSortConfig({key, direction});
    };

    const handleGoaliesSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (goaliesSortConfig && goaliesSortConfig.key === key && goaliesSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setGoaliesSortConfig({key, direction});
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

            setActions(prev => [...prev, newAction]);
            updateScores(newAction);
        }
        resetModalFlow();
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

        try {
            const gameData: IGame = {
                id: '', // Will be generated by Firebase
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
                selectedImage: gameSetup.rinkImage
            };

            await GameService.saveGame(gameData);
            localStorage.removeItem('unfinishedGame');
            alert('Game finalized successfully!');
            navigate('/start');
        } catch (error) {
            console.error('Failed to save game', error);
            alert('Failed to save game. See console for details.');
        }
    };

    // Load saved game if exists
    useEffect(() => {
        const locationState = location.state;
        if (locationState) {
            // Check if location state is a saved game object
            if ('setup' in locationState) {
                // Saved game structure
                setGameSetup(locationState.setup);
                setHomeScore(locationState.homeScore);
                setAwayScore(locationState.awayScore);
                setActions(locationState.actions);
            } else {
                // New game structure
                setGameSetup(locationState as GameSetup);
            }
        } else {
            // No location state, check localStorage
            const savedGame = localStorage.getItem('unfinishedGame');
            if (savedGame) {
                const parsed = JSON.parse(savedGame);
                setGameSetup(parsed.setup);
                setHomeScore(parsed.homeScore);
                setAwayScore(parsed.awayScore);
                setActions(parsed.actions);
            }
        }
    }, [location.state, navigate]);

    if (!gameSetup) {
        return <div>Loading game data...</div>;
    }

    return (
        <div>

            {/* First rink with clickable area */}
            <div className={styles.rinkContainer}>
                <img
                    src={gameSetup.rinkImage}
                    alt="rink"
                    onClick={handleRinkClick}
                    className={styles.clickableRink}
                />
                {showDetails && <div className={styles.iconContainer}>
                    {actions.map((action, index) => (
                        <Icon
                            key={index}
                            actionType={action.type}
                            backgroundColor={action.team.id === gameSetup.homeTeam.id ? gameSetup.homeColors.primary : gameSetup.awayColors.primary}
                            color={action.team.id === gameSetup.homeTeam.id ? gameSetup.homeColors.secondary : gameSetup.awayColors.secondary}
                            x={action.x}
                            y={action.y}
                            onClick={() => handleIconClick(action)}
                        />
                    ))}
                </div>}
            </div>

            <div>
                <p>Season: {gameSetup.season}</p>
                <p>Championship: {gameSetup.championship}</p>
                <p>Game type: {gameSetup.gameType}</p>
                <p>Score: {homeScore.goals} - {awayScore.goals}</p>

                <img src={gameSetup.homeTeam.logo} alt="home team"/>
                <p>Shots: {homeScore.shots}</p>
                <p>Turnovers: {homeScore.turnovers}</p>
                <p>Hits: {homeScore.hits}</p>

                <img src={gameSetup.awayTeam.logo} alt="away team"/>
                <p>Shots: {awayScore.shots}</p>
                <p>Turnovers: {awayScore.turnovers}</p>
                <p>Hits: {awayScore.hits}</p>
            </div>

            <div>
                <button type="button" onClick={saveGameLocally}>Save Game Locally</button>
                <button type="button" onClick={finalizeGame}>Finalize Game</button>
                <button type="button" onClick={() => setShowDetails(!showDetails)}>
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {showDetails && (
                <>
                    <h3>Team View</h3>
                    <button
                        type="button"
                        className={teamView === 'all' ? styles.active : ''}
                        onClick={() => setTeamView('all')}
                    >
                        All Teams
                    </button>
                    <button
                        type="button"
                        className={teamView === 'home' ? styles.active : ''}
                        onClick={() => setTeamView('home')}
                    >
                        Home Team
                    </button>
                    <button
                        type="button"
                        className={teamView === 'away' ? styles.active : ''}
                        onClick={() => setTeamView('away')}
                    >
                        Away Team
                    </button>

                    <h3>Periods</h3>
                    {getAvailablePeriods().length > 0 ?
                        getAvailablePeriods().map(period => (
                            <button
                                key={period}
                                type="button"
                                className={selectedPeriods.includes(period) ? styles.active : ''}
                                onClick={() => togglePeriod(period)}
                            >
                                {period}
                            </button>
                        )) :
                        <p>No available period data yet.</p>
                    }

                    <h3>Action Types</h3>
                    {getAvailableActionTypes().length > 0 ?
                        getAvailableActionTypes().map(action => (
                            <button
                                key={action}
                                type="button"
                                className={selectedActionTypes.includes(action) ? styles.active : ''}
                                onClick={() => toggleActionType(action)}
                            >
                                {action}
                            </button>
                        )) :
                        <p>No action types yet.</p>
                    }


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

                    <div>
                        <h2>Player Statistics</h2>
                        <h3>Skaters</h3>
                        <table>
                            <thead>
                            <tr>
                                <th onClick={() => handleSkatersSort('name')}>
                                    Name {skatersSortConfig?.key === 'name' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('jerseyNumber')}>
                                    Jersey# {skatersSortConfig?.key === 'jerseyNumber' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('goals')}>
                                    Goals {skatersSortConfig?.key === 'goals' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('assists')}>
                                    Assists {skatersSortConfig?.key === 'assists' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('points')}>
                                    Points {skatersSortConfig?.key === 'points' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('shots')}>
                                    Shots {skatersSortConfig?.key === 'shots' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('hits')}>
                                    Hits {skatersSortConfig?.key === 'hits' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('turnovers')}>
                                    Turnovers {skatersSortConfig?.key === 'turnovers' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSkatersSort('shotPercentage')}>
                                    Shot% {skatersSortConfig?.key === 'shotPercentage' && (skatersSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {getSortedSkaters().map(player => (
                                <tr key={player.id}
                                    className={selectedPlayer === player.id ? styles.selectedRow : ''}
                                    onClick={() => togglePlayer(player.id)}
                                >
                                    <td>{player.name}</td>
                                    <td>{player.jerseyNumber}</td>
                                    <td>{getIndividualStats(player).goals}</td>
                                    <td>{getIndividualStats(player).assists}</td>
                                    <td>{getIndividualStats(player).points}</td>
                                    <td>{getIndividualStats(player).shots}</td>
                                    <td>{getIndividualStats(player).hits}</td>
                                    <td>{getIndividualStats(player).turnovers}</td>
                                    <td>{getIndividualStats(player).shotPercentage.toFixed(2)}%</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <h3>Goalies</h3>
                        <table>
                            <thead>
                            <tr>
                                <th onClick={() => handleGoaliesSort('name')}>
                                    Name {goaliesSortConfig?.key === 'name' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('jerseyNumber')}>
                                    Jersey# {goaliesSortConfig?.key === 'jerseyNumber' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('goals')}>
                                    Goals {goaliesSortConfig?.key === 'goals' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('assists')}>
                                    Assists {goaliesSortConfig?.key === 'assists' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('points')}>
                                    Points {goaliesSortConfig?.key === 'points' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('shots')}>
                                    Shots {goaliesSortConfig?.key === 'shots' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('hits')}>
                                    Hits {goaliesSortConfig?.key === 'hits' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('turnovers')}>
                                    Turnovers {goaliesSortConfig?.key === 'turnovers' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleGoaliesSort('shotPercentage')}>
                                    Save% {goaliesSortConfig?.key === 'shotPercentage' && (goaliesSortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {getSortedGoalies().map(player => (
                                <tr key={player.id}
                                    className={selectedPlayer === player.id ? styles.selectedRow : ''}
                                    onClick={() => togglePlayer(player.id)}
                                >
                                    <td>{player.name}</td>
                                    <td>{player.jerseyNumber}</td>
                                    <td>{getIndividualStats(player).goals}</td>
                                    <td>{getIndividualStats(player).assists}</td>
                                    <td>{getIndividualStats(player).points}</td>
                                    <td>{getIndividualStats(player).shots}</td>
                                    <td>{getIndividualStats(player).hits}</td>
                                    <td>{getIndividualStats(player).turnovers}</td>
                                    <td>{getIndividualStats(player).shotPercentage.toFixed(2)}%</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modals */}
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
            />

            <AssistSelectorModal
                isOpen={modalStep === 'assist'}
                team={currentAction.team}
                excludedPlayer={currentAction.player}
                onClose={resetModalFlow}
                onSelect={handleAssistSelect}
            />

            <ConfirmationModal
                isOpen={modalStep === 'confirm'}
                action={currentAction}
                position={selectedPosition}
                onClose={resetModalFlow}
                onConfirm={confirmAction}
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