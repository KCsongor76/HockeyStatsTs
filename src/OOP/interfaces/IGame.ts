import {IGameAction} from "./IGameAction";
import {IScoreData} from "./IScoreData";
import {GameType} from "../enums/GameType";
import {Season} from "../enums/Season";
import {Championship} from "../enums/Championship";
import {ITeam} from "./ITeam";

export interface IGame {
    id: string;
    type: GameType;
    season: Season;
    championship: Championship;
    actions: IGameAction[];
    timestamp: string;
    score: { home: IScoreData; away: IScoreData };
    teams: { home: ITeam, away: ITeam };
    selectedImage: string;
}