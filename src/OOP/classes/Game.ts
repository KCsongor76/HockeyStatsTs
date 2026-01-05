import {IGame} from "../interfaces/IGame";
import {IGameAction} from "../interfaces/IGameAction";
import {Championship} from "../enums/Championship";
import {IScoreData} from "../interfaces/IScoreData";
import {Season} from "../enums/Season";
import {ITeam} from "../interfaces/ITeam";
import {GameType} from "../enums/GameType";

export interface GameFilterCriteria {
    homeTeamId?: string;
    awayTeamId?: string;
    championship?: Championship | "";
    season?: Season | "";
    gameType?: GameType | "";
}

export class Game implements IGame {
    actions: IGameAction[];
    championship: Championship;
    id: string;
    score: { home: IScoreData; away: IScoreData };
    season: Season;
    selectedImage: string;
    teams: { home: ITeam; away: ITeam };
    colors: { home: { primary: string, secondary: string }, away: { primary: string, secondary: string } };
    timestamp: string;
    type: GameType;

    constructor(data: IGame) {
        this.actions = data.actions;
        this.championship = data.championship;
        this.id = data.id;
        this.score = data.score;
        this.season = data.season;
        this.selectedImage = data.selectedImage;
        this.teams = data.teams;
        this.colors = data.colors;
        this.timestamp = data.timestamp;
        this.type = data.type;
    }

    get formattedDate(): string {
        if (!this.timestamp) return "N/A";
        const date = new Date(this.timestamp);
        return date.toISOString().split('T')[0];
    }

    static sort(games: Game[], order: 'newest' | 'oldest'): Game[] {
        return [...games].sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return order === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }

    static filter(games: Game[], criteria: GameFilterCriteria): Game[] {
        return games.filter(game => {
            return (
                (!criteria.homeTeamId || game.teams.home.id === criteria.homeTeamId) &&
                (!criteria.awayTeamId || game.teams.away.id === criteria.awayTeamId) &&
                (!criteria.championship || game.championship === criteria.championship) &&
                (!criteria.gameType || game.type === criteria.gameType) &&
                (!criteria.season || game.season === criteria.season)
            );
        });
    }
}