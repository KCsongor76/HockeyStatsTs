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
import PlayerTable from "../components/PlayerTable";
import Button from "../components/Button";
import GameScoreData from "../components/GameScoreData";
import TeamFilters from "../components/TeamFilters";
import PeriodFilters from "../components/PeriodFilters";
import ActionTypeFilters from "../components/ActionTypeFilters";

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

// todo: table component, why doesn't get here automatic left-right scrolling, when display width is so small? (because on SavedGameDetailPage, here it doesn't)
// todo: Period: not number, Period

const GamePage = () => {
    const location = useLocation();
    const [gameSetup, setGameSetup] = useState<GameSetup | null>(null);
    const [currentGame, setCurrentGame] = useState<IGame | null>(null);
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

        const allPlayers = [...gameSetup.homeTeam.players, ...gameSetup.awayTeam.players] as IPlayer[];
        if (teamView === "home") {
            return gameSetup.homeTeam.players as IPlayer[] || [];
        } else if (teamView === "away") {
            return gameSetup.awayTeam.players as IPlayer[] || [];
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
                selectedImage: gameSetup.rinkImage
            });
        }
    }, [gameSetup, actions, homeScore, awayScore]);

    if (!gameSetup) {
        return <div>Loading game data...</div>;
    }

    return (
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

            {currentGame && <GameScoreData game={currentGame} score={currentGame.score}/>}

            <div>
                <Button styleType={"positive"} type="button" onClick={saveGameLocally}>Save Game Locally</Button>
                <Button styleType={"positive"} type="button" onClick={finalizeGame}>Finalize Game</Button>
                <Button
                    styleType={showDetails ? "negative" : "positive"}
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
            </div>

            {showDetails && (
                <>
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