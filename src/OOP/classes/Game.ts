import {IGame} from "../interfaces/IGame";
import {IGameAction} from "../interfaces/IGameAction";
import {Championship} from "../enums/Championship";
import {IScoreData} from "../interfaces/IScoreData";
import {Season} from "../enums/Season";
import {ITeam} from "../interfaces/ITeam";
import {GameType} from "../enums/GameType";

export class Game implements IGame {
    actions: IGameAction[];
    championship: Championship;
    id: string;
    score: { home: IScoreData; away: IScoreData };
    season: Season;
    selectedImage: string;
    teams: { home: ITeam; away: ITeam };
    timestamp: string;
    type: GameType;

    constructor(actions: IGameAction[], championship: Championship, id: string, score: {
        home: IScoreData;
        away: IScoreData
    }, season: Season, selectedImage: string, teams: { home: ITeam; away: ITeam }, timestamp: string, type: GameType) {
        this.actions = actions;
        this.championship = championship;
        this.id = id;
        this.score = score;
        this.season = season;
        this.selectedImage = selectedImage;
        this.teams = teams;
        this.timestamp = timestamp;
        this.type = type;
    }


}