import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {IGame} from "../OOP/interfaces/IGame";
import {GameType} from "../OOP/enums/GameType";
import {ActionType} from "../OOP/enums/ActionType";
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
import {GameUtils} from "../utils/GameUtils";
import GameHeader from "../components/game/GameHeader";
import {ActionTypeFilter, ColorSelector, PeriodFilter, TeamFilter} from "../components/game/GameFilters";
import RinkMap from "../components/game/RinkMap";
import ActionTable from "../components/game/ActionTable";
import PlayerStatsTable, {RosterPlayer} from "../components/tables/PlayerStatsTable";
import styles from "./GamePage.module.css";

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

const SavedGameDetailPage = () => {
    const locationData = useLocation();
    const [game, setGame] = useState<IGame>(locationData.state as IGame);
    const [teamView, setTeamView] = useState<"all" | "home" | "away">("all")
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
    const [selectedActionTypes, setSelectedActionTypes] = useState<ActionType[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<IGameAction | null>(null);

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

    const [useDefaultHomeTeamColors, setUseDefaultHomeTeamColors] = useState<boolean>(false);
    const [useDefaultAwayTeamColors, setUseDefaultAwayTeamColors] = useState<boolean>(false);

    const navigate = useNavigate();

    const [sortField, setSortField] = useState<SortField>('period');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [playerSortField, setPlayerSortField] = useState<PlayerSortField>('points');
    const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('desc');

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
                updatedActions = game.actions.map(action =>
                    action === editingAction ? newAction : action
                );
            } else {
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

    const getIconColors = (action: IGameAction) => {
        const isHomeTeam = action.team.id === game.teams.home.id;

        if (isHomeTeam && useDefaultHomeTeamColors) {
            return {
                backgroundColor: game.teams.home.homeColor.primary,
                color: game.teams.home.homeColor.secondary
            };
        }

        if (!isHomeTeam && useDefaultAwayTeamColors) {
            return {
                backgroundColor: game.teams.away.awayColor.primary,
                color: game.teams.away.awayColor.secondary
            };
        }

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

    const handlePlayerSort = (field: any) => {
        if (playerSortField === field) {
            setPlayerSortDirection(playerSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPlayerSortField(field);
            setPlayerSortDirection('asc');
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
                aValue = GameUtils.getTotalGameTime(a, game.type);
                bValue = GameUtils.getTotalGameTime(b, game.type);
                break;
            case 'time':
                aValue = GameUtils.getTotalGameTime(a, game.type);
                bValue = GameUtils.getTotalGameTime(b, game.type);
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
        if (!game) return [];
        return players.map(p => ({
            id: p.id,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            stats: Player.getPlayerStats([game], p)
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

    return (
        <div className={styles.pageContainer}>
            <GameHeader game={game}/>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Team View</h3>
            <TeamFilter teamView={teamView} setTeamView={setTeamView}/>
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Icon Colors</h3>
            <ColorSelector
                useDefaultHome={useDefaultHomeTeamColors}
                setUseDefaultHome={setUseDefaultHomeTeamColors}
                useDefaultAway={useDefaultAwayTeamColors}
                setUseDefaultAway={setUseDefaultAwayTeamColors}
            />
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Periods</h3>
            <PeriodFilter
                availablePeriods={availablePeriods}
                selectedPeriods={selectedPeriods}
                togglePeriod={togglePeriod}
                gameType={game.type}
            />
            </div>

            <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Action Types</h3>
            <ActionTypeFilter
                availableActionTypes={availableActionTypes}
                selectedActionTypes={selectedActionTypes}
                toggleActionType={toggleActionType}
            />
            </div>

            <RinkMap
                rinkImage={game.selectedImage}
                actions={getFilteredActions()}
                getIconColors={getIconColors}
                onIconClick={handleIconClick}
            />

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

            <ActionTable
                actions={sortedActions}
                gameType={game.type}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onView={handleActionEdit}
                onDelete={handleActionDelete}
            />

            <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px'}}>
                <Button styleType={"negative"} onClick={deleteHandler}>Delete Game</Button>
                <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
            </div>

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
        </div>
    );
};

export default SavedGameDetailPage;