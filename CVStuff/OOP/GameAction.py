from typing import Optional, List, Dict, Any

from backend.OOP.ActionType import ActionType
from backend.OOP.Player import Player
from backend.OOP.Team import Team


class GameAction:
    def __init__(self,
                 type: ActionType,
                 team: Team,
                 player: Player,
                 period: int,
                 time: int,
                 x: float,
                 y: float,
                 assists: Optional[List[Player]] = None):
        self.type = type
        self.team = team
        self.player = player
        self.period = period
        self.time = time
        self.x = x
        self.y = y
        self.assists = assists or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "team": self.team.to_dict(),
            "player": self.player.to_dict(),
            "period": self.period,
            "time": self.time,
            "x": self.x,
            "y": self.y,
            "assists": [assist.to_dict() for assist in self.assists]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GameAction':
        return cls(
            type=ActionType(data["type"]),
            team=Team.from_dict(data["team"]),
            player=Player.from_dict(data["player"]),
            period=data["period"],
            time=data["time"],
            x=data["x"],
            y=data["y"],
            assists=[Player.from_dict(a) for a in data.get("assists", [])]
        )

    def __repr__(self) -> str:
        return f"IGameAction(type={self.type}, team={self.team.name}, player={self.player.name}, period={self.period})"