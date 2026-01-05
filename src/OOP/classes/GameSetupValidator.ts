export interface GameSetupConfig {
    homeTeamId: string;
    awayTeamId: string;
    homeColors: { primary: string; secondary: string };
    awayColors: { primary: string; secondary: string };
    rinkImage: string;
}

export class GameSetupValidator {
    static validateGameSetup(config: GameSetupConfig): Record<string, string> {
        const errors: Record<string, string> = {};
        const {homeTeamId, awayTeamId, homeColors, awayColors, rinkImage} = config;

        if (!homeTeamId) errors.homeTeamId = "Home team must be selected";
        if (!awayTeamId) errors.awayTeamId = "Away team must be selected";
        if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
            errors.sameTeams = "Home and away teams cannot be the same";
        }

        // todo: get rid of this normalize function, just use it inline
        const normalize = (c: string) => c.toLowerCase();

        if (normalize(homeColors.primary) === normalize(homeColors.secondary)) {
            errors.homeColors = "Home team's primary and secondary colors cannot be the same";
        }
        if (normalize(awayColors.primary) === normalize(awayColors.secondary)) {
            errors.awayColors = "Away team's primary and secondary colors cannot be the same";
        }

        if (normalize(homeColors.primary) === normalize(awayColors.primary) &&
            normalize(homeColors.secondary) === normalize(awayColors.secondary)) {
            errors.sameColors = "Home and away team colors cannot be identical";
        }

        if (!rinkImage) errors.rinkImage = "You must select a rink image";

        return errors;
    }
}