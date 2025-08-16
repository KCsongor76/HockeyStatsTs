import {IPlayer} from "./IPlayer";
import {Championship} from "../enums/Championship";

export interface ITeam {
    id: string;
    name: string;
    logo: string;
    championships: Championship[];
    homeColor: {
        primary: string;
        secondary: string;
    }
    awayColor: {
        primary: string;
        secondary: string;
    }
    players: IPlayer[]
    roster?: IPlayer[]
}