import {GameType} from "../OOP/enums/GameType";
import {PlayoffPeriod, RegularPeriod} from "../OOP/enums/Period";
import {IGameAction} from "../OOP/interfaces/IGameAction";

export class GameUtils {
    static getPeriodStartTime(period: number, gameType: GameType): number {
        if (gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST:
                    return 0;
                case RegularPeriod.SECOND:
                    return 20 * 60;
                case RegularPeriod.THIRD:
                    return 40 * 60;
                case RegularPeriod.OT:
                    return 60 * 60;
                case RegularPeriod.SO:
                    return 65 * 60;
                default:
                    return (period - 1) * 20 * 60;
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST:
                    return 0;
                case PlayoffPeriod.SECOND:
                    return 20 * 60;
                case PlayoffPeriod.THIRD:
                    return 40 * 60;
                default:
                    // Overtime periods: 60 minutes + (period - 3) * 20 minutes
                    return 60 * 60 + (period - PlayoffPeriod.THIRD) * 20 * 60;
            }
        }
    }

    static getTotalGameTime(action: IGameAction, gameType: GameType): number {
        const periodStart = this.getPeriodStartTime(action.period, gameType);
        return periodStart + action.time;
    }

    static formatGameTime(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    static getPeriodLabel(period: number, gameType: GameType): string {
        if (gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST:
                    return '1st';
                case RegularPeriod.SECOND:
                    return '2nd';
                case RegularPeriod.THIRD:
                    return '3rd';
                case RegularPeriod.OT:
                    return 'OT';
                case RegularPeriod.SO:
                    return 'SO';
                default:
                    return `${period}`;
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST:
                    return '1st';
                case PlayoffPeriod.SECOND:
                    return '2nd';
                case PlayoffPeriod.THIRD:
                    return '3rd';
                default:
                    return `OT${period - PlayoffPeriod.THIRD}`;
            }
        }
    }

    static getPeriodFilterLabel(period: number, gameType: GameType): string {
        if (gameType === GameType.PLAYOFF) {
            return PlayoffPeriod[period] || period.toString();
        } else {
            return RegularPeriod[period] || period.toString();
        }
    }
}