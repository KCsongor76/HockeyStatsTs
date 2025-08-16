import {IPlayer} from "../interfaces/IPlayer";
import {Position} from "../enums/Position";
import {IGame} from "../interfaces/IGame";
import {ActionType} from "../enums/ActionType";

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
                    if (action.assists?.some(p => p.id === player.id)) {
                        assists++;
                    }
                }
            });
        });

        const gamesPlayed = playerGames.length;
        const shotPercentage = shots > 0 ? (goals / shots) * 100 : 0;
        const points = goals + assists;

        return {
            gamesPlayed,
            goals,
            assists,
            points,
            shots,
            turnovers,
            hits,
            shotPercentage
        };
    };
}