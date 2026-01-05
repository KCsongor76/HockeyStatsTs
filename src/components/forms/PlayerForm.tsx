import React, {useState} from 'react';
import {Position} from "../../OOP/enums/Position";
import {ITeam} from "../../OOP/interfaces/ITeam";
import Input from "../Input";
import Select from "../Select";
import Checkbox from "../Checkbox";
import Button from "../Button";
import {IPlayer} from "../../OOP/interfaces/IPlayer";

export interface PlayerFormData {
    name: string;
    jerseyNumber: number;
    position: Position;
    teamId: string;
}

interface PlayerFormProps {
    initialData?: Partial<IPlayer>;
    teams?: ITeam[];
    showTeamSelector?: boolean;
    onSubmit: (data: PlayerFormData) => Promise<void> | void;
    onCancel: () => void;
    submitLabel: string;
    errors?: Record<string, string>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const PlayerForm: React.FC<PlayerFormProps> = ({
                                                   initialData,
                                                   teams = [],
                                                   showTeamSelector = false,
                                                   onSubmit,
                                                   onCancel,
                                                   submitLabel,
                                                   errors = {},
                                                   setErrors
                                               }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [jerseyNumber, setJerseyNumber] = useState(initialData?.jerseyNumber || 1);
    const [position, setPosition] = useState<Position>(initialData?.position || Position.GOALIE);
    const [teamId, setTeamId] = useState(initialData?.teamId || (teams.length > 0 ? teams[0].id : ''));
    const [isFreeAgent, setIsFreeAgent] = useState(initialData?.teamId === 'free-agent');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalTeamId = isFreeAgent ? 'free-agent' : teamId;
        await onSubmit({
            name,
            jerseyNumber,
            position,
            teamId: finalTeamId
        });
    };

    const positionOptions = Object.values(Position).map(p => ({value: p, label: p}));
    const teamOptions = teams
        .filter(t => t.id !== 'free-agent')
        .map(t => ({value: t.id, label: t.name}));

    return (
        <form onSubmit={handleSubmit}>
            <Input
                id="name"
                label="Name:"
                type="text"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    if (setErrors) setErrors(prev => ({...prev, name: ''}));
                }}
                required
                error={errors.name}
            />

            <Input
                id="jerseyNumber"
                label="Jersey number:"
                type="number"
                value={jerseyNumber}
                onChange={(e) => {
                    setJerseyNumber(Number(e.target.value));
                    if (setErrors) setErrors(prev => ({...prev, jerseyNumber: ''}));
                }}
                required
                min={1}
                max={99}
                error={errors.jerseyNumber}
            />

            <Select
                id="position"
                label="Position:"
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                options={positionOptions}
            />

            {showTeamSelector && (
                <>
                    <Checkbox
                        id="freeAgent"
                        label="Free Agent"
                        checked={isFreeAgent}
                        onChange={() => setIsFreeAgent(!isFreeAgent)}
                    />

                    {!isFreeAgent && (
                        <Select
                            id="team"
                            label="Team:"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            options={teamOptions}
                        />
                    )}
                </>
            )}

            {errors.general && <span>{errors.general}</span>}

            <div>
                <Button styleType={"positive"} type="submit">{submitLabel}</Button>
                <Button styleType={"negative"} type="button" onClick={onCancel}>
                    {initialData && !showTeamSelector ? "Discard" : "Go Back"}
                </Button>
            </div>
        </form>
    );
};

export default PlayerForm;