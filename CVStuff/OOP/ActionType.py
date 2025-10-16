from enum import Enum


class ActionType(Enum):
    SHOT = "Shot"
    GOAL = "Goal"
    ASSIST = "Assist"
    TURNOVER = "Turnover"
    HIT = "Hit"
    FaceOff = "FaceOff"