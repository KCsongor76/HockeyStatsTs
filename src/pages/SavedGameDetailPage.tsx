import React, {useState} from 'react';
import {useLocation} from "react-router-dom";
import {IGame} from "../OOP/interfaces/IGame";
import styles from "./GamePage.module.css";
import {ActionType} from "../OOP/enums/ActionType";
import Icon from "../components/Icon";
import {IGameAction} from "../OOP/interfaces/IGameAction";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {Position} from "../OOP/enums/Position";
import ActionDetailsModal from "../modals/ActionDetailsModal";

const SavedGameDetailPage = () => {
    const locationData = useLocation();
    const game = locationData.state as IGame;
    const [teamView, setTeamView] = useState<"all" | "home" | "away">("all")
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [selectedActionTypes, setSelectedActionTypes] = useState<ActionType[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<IGameAction | null>(null); // New state for action details
    const [skatersSortConfig, setSkatersSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [goaliesSortConfig, setGoaliesSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    console.log(game)

    const getAvailablePeriods = () => {
        const availablePeriods = new Set<number>();
        game.actions.forEach(action => {
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
        game.actions.forEach(action => {
            availableActionTypes.add(action.type);
        })
        const actionTypesArray: ActionType[] = [];
        availableActionTypes.forEach((actionType) => {
            actionTypesArray.push(actionType);
        })
        return actionTypesArray;
    }

    const getFilteredPlayers = () => {
        if (!game) return [];

        const allPlayers = [...game.teams.home.players, ...game.teams.away.players] as IPlayer[];
        if (teamView === "home") {
            return game.teams.home.players as IPlayer[] || [];
        } else if (teamView === "away") {
            return game.teams.away.players as IPlayer[] || [];
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

        game.actions.forEach(action => {
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
            if (game && player.teamId === game.teams.home.id) {
                shotPercentage = (game.score.away.shots - game.score.away.goals) / game.score.away.shots;
            } else if (game) {
                shotPercentage = (game.score.home.shots - game.score.home.goals) / game.score.home.shots;
            } else {
                shotPercentage = 0;
            }
        }
        shotPercentage *= 100

        return {name, jerseyNumber, goals, assists, points, hits, turnovers, shots, shotPercentage}
    }

    const getFilteredActions = () => {
        if (!game) return [];

        return game.actions.filter(action => {
            // Team filter
            if (teamView === 'home' && action.team.id !== game.teams.home.id) return false;
            if (teamView === 'away' && action.team.id !== game.teams.away.id) return false;

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

    const handleIconClick = (action: IGameAction) => {
        setSelectedAction(action);
    };

    return (
        <div>
            <div>
                <p>Season: {game.season}</p>
                <p>Championship: {game.championship}</p>
                <p>Game type: {game.type}</p>
                <p>Score: {game.score.home.goals} - {game.score.away.goals}</p>

                <img src={game.teams.home.logo} alt="home team"/>
                <p>Shots: {game.score.home.shots}</p>
                <p>Turnovers: {game.score.home.turnovers}</p>
                <p>Hits: {game.score.home.hits}</p>

                <img src={game.teams.away.logo} alt="away team"/>
                <p>Shots: {game.score.away.shots}</p>
                <p>Turnovers: {game.score.away.turnovers}</p>
                <p>Hits: {game.score.away.hits}</p>
            </div>

            <div>
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
            </div>

            <div className={styles.rinkContainer}>
                <img src={game.selectedImage} alt="rink"/>
                <div className={styles.iconContainer}>
                    {getFilteredActions().map((action, index) => (
                        <Icon
                            key={`second-${index}`}
                            actionType={action.type}
                            backgroundColor={action.team.id === game.teams.home.id ? game.teams.home.homeColor.primary : game.teams.away.awayColor.primary}
                            color={action.team.id === game.teams.home.id ? game.teams.home.homeColor.secondary : game.teams.away.awayColor.secondary}
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

            <ActionDetailsModal
                isOpen={!!selectedAction}
                onClose={() => setSelectedAction(null)}
                action={selectedAction}
            />

        </div>
    );
};

export default SavedGameDetailPage;