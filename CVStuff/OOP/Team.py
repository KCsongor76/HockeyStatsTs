from typing import Dict, Any, List

from .Championship import Championship
from .Player import Player


class Team:
    def __init__(self,
                 id: str,
                 name: str,
                 logo: str,
                 championships: List[Championship],
                 homeColor: Dict[str, str],
                 awayColor: Dict[str, str],
                 players: List[Player],
                 roster: List[Player]):
        self.id = id
        self.name = name
        self.logo = logo
        self.championships = championships
        self.homeColor = homeColor
        self.awayColor = awayColor
        self.players = players
        self.roster = roster

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "logo": self.logo,
            "championships": [c.value for c in self.championships],
            "homeColor": self.homeColor,
            "awayColor": self.awayColor,
            "players": [player.to_dict() for player in self.players],
            "roster": [player.to_dict() for player in self.roster]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Team':
        return cls(
            id=data["id"],
            name=data["name"],
            logo=data["logo"],
            championships=[Championship(c) for c in data["championships"]],
            homeColor=data["homeColor"],
            awayColor=data["awayColor"],
            players=[Player.from_dict(p) for p in data["players"]],
            roster=[Player.from_dict(p) for p in data.get("roster", [])]
        )

    def __repr__(self) -> str:
        return f"ITeam(id={self.id}, name={self.name}, players={len(self.players)})"