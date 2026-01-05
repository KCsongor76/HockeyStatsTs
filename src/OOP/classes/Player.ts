import {IPlayer} from "../interfaces/IPlayer";
import {Position} from "../enums/Position";
import {IGame} from "../interfaces/IGame";
import {ActionType} from "../enums/ActionType";

export type PlayerSortField =
    'name'
    | 'jerseyNumber'
    | 'position'
    | 'gamesPlayed'
    | 'goals'
    | 'assists'
    | 'points'
    | 'shots'
    | 'hits'
    | 'turnovers'
    | 'shotPercentage';

export class Player implements IPlayer {
    id: string;
    jerseyNumber: number;
    name: string;
    position: Position;
    teamId: string;

    constructor(id: string, jerseyNumber: number, name: string, position: Position, teamId: string) {
        this.id = id;
        this.jerseyNumber = jerseyNumber;
        this.name = name;
        this.position = position;
        this.teamId = teamId;
    }

    static sort(
        players: IPlayer[],
        statsMap: Map<string, any>,
        field: PlayerSortField,
        direction: 'asc' | 'desc'
    ): IPlayer[] {
        return [...players].sort((a, b) => {
            const statsA = statsMap.get(a.id) || {};
            const statsB = statsMap.get(b.id) || {};

            let valueA: any;
            let valueB: any;

            switch (field) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'jerseyNumber':
                    valueA = a.jerseyNumber;
                    valueB = b.jerseyNumber;
                    break;
                case 'position':
                    valueA = a.position;
                    valueB = b.position;
                    break;
                // Stats based sorting
                case 'gamesPlayed':
                    valueA = statsA.gamesPlayed || 0;
                    valueB = statsB.gamesPlayed || 0;
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

            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    static validateName(name: string): string | null {
        if (!name || name.trim() === '') {
            return 'Name is required';
        }
        return null;
    }

    static validateJerseyNumber(jerseyNumber: number): string | null {
        if (isNaN(jerseyNumber)) {
            return 'Jersey number must be a number';
        }
        if (jerseyNumber < 1 || jerseyNumber > 99) {
            return 'Jersey number must be between 1-99';
        }
        return null;
    }

    static getPlayerStats = (games: IGame[], player: IPlayer) => {
        const playerGames = games.filter(game => {
            const homePlayers = game.teams.home.roster || [];
            const awayPlayers = game.teams.away.roster || [];
            return homePlayers.some(p => p.id === player.id) ||
                awayPlayers.some(p => p.id === player.id);
        });

        let goals = 0;
        let shots = 0;
        let turnovers = 0;
        let hits = 0;
        let assists = 0;

        playerGames.forEach(game => {
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
                            hits++;
                            break;
                        case ActionType.TURNOVER:
                            turnovers++;
                            break;
                    }
                } else {
                    if (action.assists?.some(p => p.id === player.id)) assists++;
                }
            });
        });

        const gamesPlayed = playerGames.length;
        const shotPercentage = shots > 0 ? (goals / shots) * 100 : 0;
        const points = goals + assists;

        return {gamesPlayed, goals, assists, points, shots, turnovers, hits, shotPercentage};
    };

    static mapPositionString(positionStr: string): Position {
        const lowerPosition = positionStr.toLowerCase().trim();
        switch (lowerPosition) {
            case 'goalie':
            case 'goalkeeper':
                return Position.GOALIE;
            case 'defender':
            case 'defence':
                return Position.DEFENDER;
            case 'forward':
            case 'attacker':
                return Position.FORWARD;
            default:
                throw new Error(`Unknown position: ${positionStr}`);
        }
    }

    /**
     * Parses a raw text file content into structured player data.
     * Expected format:
     * Line 1: Header/Ignored
     * Line 2: TeamID
     * Line 3+: JerseyNumber | Name | Position
     */
    static parsePlayerFile(content: string): {
        teamId: string;
        players: Array<{ jerseyNumber: number; name: string; position: Position }>
    } {
        const lines = content.split('\n').filter(line => line.trim() !== '');

        if (lines.length < 3) {
            throw new Error('Invalid file format. File must have at least 3 lines.');
        }

        // Second line: team ID
        const teamId = lines[1].trim();

        // Remaining lines: player data
        const playerLines = lines.slice(2);
        const players = playerLines.map(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length !== 3) {
                throw new Error(`Invalid player data format: ${line}`);
            }

            const jerseyNumber = parseInt(parts[0]);
            const numberError = this.validateJerseyNumber(jerseyNumber);
            if (numberError) {
                throw new Error(`Invalid jersey number ${parts[0]}: ${numberError}`);
            }

            const name = parts[1];
            const nameError = this.validateName(name);
            if (nameError) {
                throw new Error(`Invalid name ${parts[1]}: ${nameError}`);
            }

            const position = this.mapPositionString(parts[2]);

            return {jerseyNumber, name, position};
        });

        return {teamId, players};
    }
}