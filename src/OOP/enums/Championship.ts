export enum Championship {
    ERSTE_LEAGUE = "Erste League",
    ROMANIAN_CHAMPIONSHIP = "Romanian Championship",
    ROMANIAN_CUP = "Romanian Cup",
    ROMANIAN_SUPERCUP = "Romanian SuperCup",
}

export const CHAMPIONSHIP_RULES: Record<Championship, { minSkaters: number, maxSkaters: number, goalies: number }> = {
    [Championship.ERSTE_LEAGUE]: {minSkaters: 15, maxSkaters: 19, goalies: 2},
    [Championship.ROMANIAN_CHAMPIONSHIP]: {minSkaters: 15, maxSkaters: 20, goalies: 2},
    [Championship.ROMANIAN_CUP]: {minSkaters: 15, maxSkaters: 20, goalies: 2},
    [Championship.ROMANIAN_SUPERCUP]: {minSkaters: 15, maxSkaters: 20, goalies: 2},
};