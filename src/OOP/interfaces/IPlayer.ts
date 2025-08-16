import {Position} from "../enums/Position";

export interface IPlayer {
    id: string;
    name: string;
    jerseyNumber: number;
    position: Position;
    teamId: string;
}