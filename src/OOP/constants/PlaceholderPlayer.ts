import {IPlayer} from "../interfaces/IPlayer";
import {Position} from "../enums/Position";

export const PLACEHOLDER_PLAYER: IPlayer = {
    id: 'placeholder',
    name: 'Unknown Player',
    jerseyNumber: 0,
    position: Position.FORWARD,
    teamId: '',
};