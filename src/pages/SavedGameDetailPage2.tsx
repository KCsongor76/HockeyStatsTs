import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
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
import GameScoreData from "../components/GameScoreData";
import TeamFilters from "../components/TeamFilters";
import PeriodFilters from "../components/PeriodFilters";
import ActionTypeFilters from "../components/ActionTypeFilters";
import {GameService} from "../OOP/services/GameService";
import ActionSelectorModal from "../modals/ActionSelectorModal";
import PlayerSelectorModal from "../modals/PlayerSelectorModal";
import AssistSelectorModal from "../modals/AssistSelectorModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import {ITeam} from "../OOP/interfaces/ITeam";
import ActionsTable from "../components/ActionsTable";

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
            // Default colors for home team
            return {
                backgroundColor: game.teams.home.homeColor.primary,
                color: game.teams.home.homeColor.secondary
            };
        }

        if (!isHomeTeam && useDefaultAwayTeamColors) {
            // Default colors for away team
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

    return (
        <>
            <GameScoreData game={game} score={game.score}/>

            <h3 style={{textAlign: 'center'}}>Team View</h3>
            <TeamFilters teamView={teamView} setTeamView={setTeamView}/>

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
            <PeriodFilters
                availablePeriods={availablePeriods}
                selectedPeriods={selectedPeriods}
                togglePeriod={togglePeriod}
                gameType={game.type}
            />

            <h3 style={{textAlign: 'center'}}>Action Types</h3>
            <ActionTypeFilters
                availableActionTypes={availableActionTypes}
                selectedActionTypes={selectedActionTypes}
                toggleActionType={toggleActionType}
            />

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
                <PlayerTable
                    pageType="game"
                    players={getFilteredPlayers().filter(p => p.position !== Position.GOALIE)}
                    games={[game]}
                    selectedPlayer={selectedPlayer}
                    togglePlayer={togglePlayer}
                />
            )}

            <h3 style={{textAlign: 'center'}}>Goalies</h3>
            {game && (
                <PlayerTable
                    pageType="game"
                    players={getFilteredPlayers().filter(p => p.position === Position.GOALIE)}
                    games={[game]}
                    selectedPlayer={selectedPlayer}
                    togglePlayer={togglePlayer}
                />
            )}

            <ActionsTable
                actions={game.actions}
                gameType={game.type}
                onActionDelete={handleActionDelete}
                onActionEdit={handleActionEdit}
            />

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