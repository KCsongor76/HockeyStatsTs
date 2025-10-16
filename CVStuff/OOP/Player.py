from typing import Dict, Any
from backend.OOP.Position import Position


class Player:
    def __init__(self,
                 id: str,
                 name: str,
                 jerseyNumber: int,
                 position: Position,
                 teamId: str):
        self.id = None
        self.id = id
        self.name = name
        self.jerseyNumber = jerseyNumber
        self.position = position
        self.teamId = teamId

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "jerseyNumber": self.jerseyNumber,
            "position": self.position.value,
            "teamId": self.teamId
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Player':
        return cls(
            id=data["id"],
            name=data["name"],
            jerseyNumber=data["jerseyNumber"],
            position=Position(data["position"]),
            teamId=data["teamId"]
        )

    def __repr__(self) -> str:
        return f"IPlayer(id={self.id}, name={self.name}, jersey={self.jerseyNumber}, position={self.position})"