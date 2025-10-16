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

import GameScoreData from "../components/GameScoreData";
import TeamFilters from "../components/TeamFilters";
import PeriodFilters from "../components/PeriodFilters";
import ActionTypeFilters from "../components/ActionTypeFilters";

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
            <GameScoreData game={game} score={game.score}/>

            <div className={styles.filterContainer}>
                <h3>Team View</h3>
                <TeamFilters teamView={teamView} setTeamView={setTeamView}/>

                <h3>Periods</h3>
                <PeriodFilters
                    availablePeriods={availablePeriods}
                    selectedPeriods={selectedPeriods}
                    togglePeriod={togglePeriod}
                />

                <h3>Action Types</h3>
                <ActionTypeFilters
                    availableActionTypes={availableActionTypes}
                    selectedActionTypes={selectedActionTypes}
                    toggleActionType={toggleActionType}
                />
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
                {game && (
                    <PlayerTable
                        pageType="game"
                        players={getFilteredPlayers().filter(p => p.position !== Position.GOALIE)}
                        games={[game]}
                        selectedPlayer={selectedPlayer}
                        togglePlayer={togglePlayer}
                    />
                )}

                <h3>Goalies</h3>
                {game && (
                    <PlayerTable
                        pageType="game"
                        players={getFilteredPlayers().filter(p => p.position === Position.GOALIE)}
                        games={[game]}
                        selectedPlayer={selectedPlayer}
                        togglePlayer={togglePlayer}
                    />
                )}
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