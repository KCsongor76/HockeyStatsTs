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
import PlayerTable from "../components/PlayerTable";
import Button from "../components/Button";

const SavedGameDetailPage = () => {
    const locationData = useLocation();
    const game = locationData.state as IGame;
    const [teamView, setTeamView] = useState<"all" | "home" | "away">("all")
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [selectedActionTypes, setSelectedActionTypes] = useState<ActionType[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<IGameAction | null>(null); // New state for action details

    const getAvailablePeriodsAndActionTypes = () => ({
        availablePeriods: Array.from(new Set(game.actions.map(a => a.period))),
        availableActionTypes: Array.from(new Set(game.actions.map(a => a.type)))
    });

    const {availablePeriods, availableActionTypes} = getAvailablePeriodsAndActionTypes();

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
                <Button
                    styleType={"neutral"}
                    type="button"
                    className={teamView === 'all' ? styles.active : ''}
                    onClick={() => setTeamView('all')}
                >
                    All Teams
                </Button>
                <Button
                    styleType={"neutral"}
                    type="button"
                    className={teamView === 'home' ? styles.active : ''}
                    onClick={() => setTeamView('home')}
                >
                    Home Team
                </Button>
                <Button
                    styleType={"neutral"}
                    type="button"
                    className={teamView === 'away' ? styles.active : ''}
                    onClick={() => setTeamView('away')}
                >
                    Away Team
                </Button>

                <h3>Periods</h3>
                {availablePeriods.length > 0 ?
                    availablePeriods.map(period => (
                        <Button
                            styleType={"neutral"}
                            key={period}
                            type="button"
                            className={selectedPeriods.includes(period) ? styles.active : ''}
                            onClick={() => togglePeriod(period)}
                        >
                            {period}
                        </Button>
                    )) :
                    <p>No available period data yet.</p>
                }

                <h3>Action Types</h3>
                {availableActionTypes.length > 0 ?
                    availableActionTypes.map(action => (
                        <Button
                            styleType={"neutral"}
                            key={action}
                            type="button"
                            className={selectedActionTypes.includes(action) ? styles.active : ''}
                            onClick={() => toggleActionType(action)}
                        >
                            {action}
                        </Button>
                    )) :
                    <p>No action types yet.</p>
                }
            </div>

            <div className={styles.rinkContainer}>
                <img src={game.selectedImage} alt="rink"/>
                <div className={styles.iconContainer}>
                    {/*todo: colors from game setup?*/}
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
                <PlayerTable
                    pageType="game"
                    players={getFilteredPlayers().filter(p => p.position !== Position.GOALIE)}
                    games={[game]}
                    selectedPlayer={selectedPlayer}
                    togglePlayer={togglePlayer}
                />

                <h3>Goalies</h3>
                <PlayerTable
                    pageType="game"
                    players={getFilteredPlayers().filter(p => p.position === Position.GOALIE)}
                    games={[game]}
                    selectedPlayer={selectedPlayer}
                    togglePlayer={togglePlayer}
                />
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