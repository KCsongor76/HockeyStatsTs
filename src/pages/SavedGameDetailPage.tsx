import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {IGame} from "../OOP/interfaces/IGame";
import styles from "./GamePage.module.css";
import {GameType} from "../OOP/enums/GameType";
import {RegularPeriod, PlayoffPeriod} from "../OOP/enums/Period";
import {ActionType} from "../OOP/enums/ActionType";
import Icon from "../components/Icon";
import {IGameAction} from "../OOP/interfaces/IGameAction";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {Position} from "../OOP/enums/Position";
import ActionDetailsModal from "../modals/ActionDetailsModal";
import Button from "../components/Button";
import {GameService} from "../OOP/services/GameService";
import ActionSelectorModal from "../modals/ActionSelectorModal";
import PlayerSelectorModal from "../modals/PlayerSelectorModal";
import AssistSelectorModal from "../modals/AssistSelectorModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import {ITeam} from "../OOP/interfaces/ITeam";
import {Player} from "../OOP/classes/Player";

type SortField = 'type' | 'period' | 'time' | 'team' | 'player';
type SortDirection = 'asc' | 'desc';
type PlayerSortField = 'name' | 'jerseyNumber' | 'goals' | 'assists' | 'points' | 'shots' | 'hits' | 'turnovers' | 'shotPercentage';

const SavedGameDetailPage2 = () => {
    const locationData = useLocation();
    const [game, setGame] = useState<IGame>(locationData.state as IGame);
    const [teamView, setTeamView] = useState<"all" | "home" | "away">("all")
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [selectedActionTypes, setSelectedActionTypes] = useState<ActionType[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<IGameAction | null>(null);

    // New state for action editing flow
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

    // New state for color toggles
    const [useDefaultHomeTeamColors, setUseDefaultHomeTeamColors] = useState<boolean>(false);
    const [useDefaultAwayTeamColors, setUseDefaultAwayTeamColors] = useState<boolean>(false);

    const navigate = useNavigate();

    const [sortField, setSortField] = useState<SortField>('period');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [playerSortField, setPlayerSortField] = useState<PlayerSortField>('points');
    const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('desc');

    // Action editing handlers
    const handleActionEdit = (action: IGameAction) => {
        setEditingAction(action);
        setCurrentAction(action);
        setSelectedPosition({x: action.x, y: action.y});
        setModalStep("confirm");
    };

    const handleActionDelete = async (actionToDelete: IGameAction) => {
        if (window.confirm('Are you sure you want to delete this action?')) {
            const updatedActions = game.actions.filter(action => action !== actionToDelete);
            const updatedGame = {
                ...game,
                actions: updatedActions,
                score: recalculateScores(updatedActions)
            };

            setGame(updatedGame);

            try {
                await GameService.updateGame(updatedGame);
                alert('Action deleted successfully!');
            } catch (error) {
                console.error('Failed to update game', error);
                alert('Failed to update game. See console for details.');
            }
        }
    };

    const recalculateScores = (actions: IGameAction[]) => {
        const newHomeScore = {goals: 0, shots: 0, turnovers: 0, hits: 0};
        const newAwayScore = {goals: 0, shots: 0, turnovers: 0, hits: 0};

        actions.forEach(action => {
            const score = action.team.id === game.teams.home.id ? newHomeScore : newAwayScore;
            score.goals += action.type === ActionType.GOAL ? 1 : 0;
            score.shots += [ActionType.SHOT, ActionType.GOAL].includes(action.type) ? 1 : 0;
            score.turnovers += action.type === ActionType.TURNOVER ? 1 : 0;
            score.hits += action.type === ActionType.HIT ? 1 : 0;
        });

        return {home: newHomeScore, away: newAwayScore};
    };

    // Modal flow handlers
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

    const resetModalFlow = () => {
        setModalStep(null);
        setSelectedPosition(null);
        setCurrentAction({});
        setEditingAction(null);
    };

    const confirmAction = async () => {
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

            let updatedActions;
            if (editingAction) {
                // Update mode
                updatedActions = game.actions.map(action =>
                    action === editingAction ? newAction : action
                );
            } else {
                // Create mode
                updatedActions = [...game.actions, newAction];
            }

            const updatedGame = {
                ...game,
                actions: updatedActions,
                score: recalculateScores(updatedActions)
            };

            setGame(updatedGame);

            try {
                await GameService.updateGame(updatedGame);
                alert(editingAction ? 'Action updated successfully!' : 'Action added successfully!');
            } catch (error) {
                console.error('Failed to update game', error);
                alert('Failed to update game. See console for details.');
            }
        }

        resetModalFlow();
    };

    const handleIconClick = (action: IGameAction) => {
        setSelectedAction(action);
    };

    const getAvailablePeriodsAndActionTypes = () => ({
        availablePeriods: Array.from(new Set(game.actions.map(a => a.period))),
        availableActionTypes: Array.from(new Set(game.actions.map(a => a.type)))
    });

    const {availablePeriods, availableActionTypes} = getAvailablePeriodsAndActionTypes();

    const getFilteredPlayers = () => {
        if (!game) return [];

        const allPlayers = [...game.teams.home.roster, ...game.teams.away.roster] as IPlayer[];
        if (teamView === "home") {
            return game.teams.home.roster as IPlayer[] || [];
        } else if (teamView === "away") {
            return game.teams.away.roster as IPlayer[] || [];
        }
        return allPlayers;
    }

    const getFilteredActions = () => {
        if (!game) return [];

        return game.actions.filter(action => {
            if (teamView === 'home' && action.team.id !== game.teams.home.id) return false;
            if (teamView === 'away' && action.team.id !== game.teams.away.id) return false;
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

    const getIconColors = (action: IGameAction) => {
        const isHomeTeam = action.team.id === game.teams.home.id;

        if (isHomeTeam && useDefaultHomeTeamColors) {
            // Default colors for the home team
            return {
                backgroundColor: game.teams.home.homeColor.primary,
                color: game.teams.home.homeColor.secondary
            };
        }

        if (!isHomeTeam && useDefaultAwayTeamColors) {
            // Default colors for the away team
            return {
                backgroundColor: game.teams.away.awayColor.primary,
                color: game.teams.away.awayColor.secondary
            };
        }

        // Use game colors
        return {
            backgroundColor: isHomeTeam
                ? game.colors.home.primary
                : game.colors.away.primary,
            color: isHomeTeam
                ? game.colors.home.secondary
                : game.colors.away.secondary
        };
    };

    const deleteHandler = async () => {
        if (window.confirm("Are you sure you want to delete this game?")) {
            try {
                await GameService.deleteGame(game)
                alert("Game successfully deleted!")
                navigate(-1)
            } catch (error) {
                console.error(error);
                alert("Unsuccessful deletion.")
            }
        } else {
            alert("Deletion canceled.")
        }
    }

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
        if (game.type === GameType.REGULAR) {
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
        if (game.type === GameType.REGULAR) {
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
        if (game.type === GameType.PLAYOFF) {
            return PlayoffPeriod[period] || period.toString();
        } else {
            return RegularPeriod[period] || period.toString();
        }
    };

    const sortedActions = [...game.actions].sort((a, b) => {
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
            const statsA = Player.getPlayerStats([game], a);
            const statsB = Player.getPlayerStats([game], b);

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

    return (
        <>
            {/*<GameScoreData game={game} score={game.score}/>*/}

            <div className={styles.scoreContainer}>
                <div className={styles.scoreHeader}>
                    <div>
                        <p>Season: {game.season}</p>
                        <p>Championship: {game.championship}</p>
                        <p>Game type: {game.type}</p>
                    </div>
                    <div className={styles.scoreValue}>
                        Score: {game.score.home.goals} - {game.score.away.goals}
                    </div>
                </div>

                <div className={styles.teamStats}>
                    <div className={styles.teamSection}>
                        <div className={styles.teamHeader}>
                            <img src={game.teams?.home.logo} alt="home team" className={styles.teamLogo}/>
                            <h3>Home Team</h3>
                        </div>
                        <div className={styles.statItem}><span>Shots:</span> <span>{game.score.home.shots}</span></div>
                        <div className={styles.statItem}><span>Turnovers:</span> <span>{game.score.home.turnovers}</span></div>
                        <div className={styles.statItem}><span>Hits:</span> <span>{game.score.home.hits}</span></div>
                    </div>

                    <div className={styles.teamSection}>
                        <div className={styles.teamHeader}>
                            <img src={game.teams?.away.logo} alt="away team" className={styles.teamLogo}/>
                            <h3>Away Team</h3>
                        </div>
                        <div className={styles.statItem}><span>Shots:</span> <span>{game.score.away.shots}</span></div>
                        <div className={styles.statItem}><span>Turnovers:</span> <span>{game.score.away.turnovers}</span></div>
                        <div className={styles.statItem}><span>Hits:</span> <span>{game.score.away.hits}</span></div>
                    </div>
                </div>
            </div>

            <h3 style={{textAlign: 'center'}}>Team View</h3>
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

            <h3 style={{textAlign: 'center'}}>Icon Colors</h3>
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center'}}>
                <div>
                    <Button
                        styleType={useDefaultHomeTeamColors ? 'positive' : 'neutral'}
                        onClick={() => setUseDefaultHomeTeamColors(!useDefaultHomeTeamColors)}
                    >
                        {useDefaultHomeTeamColors ? 'Home-currently: Default Colors' : 'Home-currently: Game Colors'}
                    </Button>
                </div>
                <div>
                    <Button
                        styleType={useDefaultAwayTeamColors ? 'positive' : 'neutral'}
                        onClick={() => setUseDefaultAwayTeamColors(!useDefaultAwayTeamColors)}
                    >
                        {useDefaultAwayTeamColors ? 'Away-currently: Default Colors' : 'Away-currently: Game Colors'}
                    </Button>
                </div>
            </div>

            <h3 style={{textAlign: 'center'}}>Periods</h3>
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

            <h3 style={{textAlign: 'center'}}>Action Types</h3>
            {/*<ActionTypeFilters*/}
            {/*    availableActionTypes={availableActionTypes}*/}
            {/*    selectedActionTypes={selectedActionTypes}*/}
            {/*    toggleActionType={toggleActionType}*/}
            {/*/>*/}

            <div className={styles.filterContainer}>
                {availableActionTypes.length > 0 ? availableActionTypes.map(period => (
                    <Button
                        styleType={"neutral"}
                        key={period}
                        type="button"
                        className={selectedActionTypes.includes(period) ? styles.activeButton : ''}
                        onClick={() => toggleActionType(period)}
                    >
                        {period}
                    </Button>
                )) : <p>No available period data yet.</p>}
            </div>

            <div className={styles.rinkContainer}>
                <img src={game.selectedImage} alt="rink"/>
                <div className={styles.iconContainer}>
                    {getFilteredActions().map((action, index) => {
                        const colors = getIconColors(action);
                        return (
                            <Icon
                                key={`second-${index}`}
                                actionType={action.type}
                                backgroundColor={colors.backgroundColor}
                                color={colors.color}
                                x={action.x}
                                y={action.y}
                                onClick={() => handleIconClick(action)}
                            />
                        );
                    })}
                </div>
            </div>

            <h3 style={{textAlign: 'center'}}>Skaters</h3>
            {game && (
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
                                <td>{Player.getPlayerStats([game], player).goals}</td>
                                <td>{Player.getPlayerStats([game], player).assists}</td>
                                <td>{Player.getPlayerStats([game], player).points}</td>
                                <td>{Player.getPlayerStats([game], player).shots}</td>
                                <td>{Player.getPlayerStats([game], player).hits}</td>
                                <td>{Player.getPlayerStats([game], player).turnovers}</td>
                                <td>{Player.getPlayerStats([game], player).shotPercentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h3 style={{textAlign: 'center'}}>Goalies</h3>
            {game && (
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
                                <td>{Player.getPlayerStats([game], player).goals}</td>
                                <td>{Player.getPlayerStats([game], player).assists}</td>
                                <td>{Player.getPlayerStats([game], player).points}</td>
                                <td>{Player.getPlayerStats([game], player).shots}</td>
                                <td>{Player.getPlayerStats([game], player).hits}</td>
                                <td>{Player.getPlayerStats([game], player).turnovers}</td>
                                <td>{Player.getPlayerStats([game], player).shotPercentage.toFixed(2)}%</td>
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

            <Button styleType={"negative"} onClick={deleteHandler}>Delete Game</Button>
            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>

            <ActionSelectorModal
                isOpen={modalStep === 'action'}
                onClose={resetModalFlow}
                onSelect={handleActionSelect}
                homeTeam={game.teams.home}
                awayTeam={game.teams.away}
                homeColors={useDefaultHomeTeamColors ? game.teams.home.homeColor : game.colors.home}
                awayColors={useDefaultAwayTeamColors ? game.teams.away.awayColor : game.colors.away}
                gameType={game.type}
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
                mode={editingAction ? 'edit' : 'create'}
            />

            <ActionDetailsModal
                isOpen={!!selectedAction}
                onClose={() => setSelectedAction(null)}
                action={selectedAction}
            />
        </>
    );
};

export default SavedGameDetailPage2;