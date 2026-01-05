import React, {useState} from 'react';
import {ITeam} from "../../OOP/interfaces/ITeam";
import {Championship} from "../../OOP/enums/Championship";
import {Team} from "../../OOP/classes/Team";
import Input from "../Input";
import ExampleIcon from "../ExampleIcon";
import {ActionType} from "../../OOP/enums/ActionType";
import Checkbox from "../Checkbox";
import Button from "../Button";

export interface TeamFormData {
    name: string;
    logoFile: File | null;
    homeColor: { primary: string; secondary: string };
    awayColor: { primary: string; secondary: string };
    championships: Championship[];
}

interface TeamFormProps {
    initialData?: ITeam;
    onSubmit: (data: TeamFormData) => Promise<void>;
    onCancel: () => void;
    submitLabel: string;
    errors?: Record<string, string>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const TeamForm: React.FC<TeamFormProps> = ({initialData, onSubmit, onCancel, submitLabel, errors = {}, setErrors}) => {
    const [name, setName] = useState<string>(initialData?.name || "");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [homeColor, setHomeColor] = useState(initialData?.homeColor || {primary: "#ffffff", secondary: "#000000"});
    const [awayColor, setAwayColor] = useState(initialData?.awayColor || {primary: "#ffffff", secondary: "#000000"});
    const [championships, setChampionships] = useState<Championship[]>(initialData?.championships || []);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const error = Team.validateLogoFile(file);

            if (error && setErrors) {
                setErrors(prev => ({...prev, logo: error}));
                return;
            }

            setLogoFile(file);
            if (setErrors) setErrors(prev => ({...prev, logo: ''}));
        }
    };

    const toggleChampionship = (championship: Championship) => {
        setChampionships(prev =>
            prev.includes(championship)
                ? prev.filter(c => c !== championship)
                : [...prev, championship]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
            logoFile,
            homeColor,
            awayColor,
            championships
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                id="name"
                label="Team Name:"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                error={errors.name}
            />

            <Input
                id="logo"
                label={initialData?.logo ? "Update Logo (Optional):" : "Team Logo:"}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                required={!initialData?.logo}
                error={errors.logo}
            />

            <h3>Team Home Colors:</h3>
            <Input
                id="homePrimary"
                label="Primary"
                type="color"
                value={homeColor.primary}
                onChange={(e) => setHomeColor(prev => ({...prev, primary: e.target.value}))}
            />
            <Input
                id="homeSecondary"
                label="Secondary"
                type="color"
                value={homeColor.secondary}
                onChange={(e) => setHomeColor(prev => ({...prev, secondary: e.target.value}))}
            />
            <ExampleIcon actionType={ActionType.GOAL} backgroundColor={homeColor.primary} color={homeColor.secondary}/>

            <h3>Team Away Colors:</h3>
            <Input
                id="awayPrimary"
                label="Primary"
                type="color"
                value={awayColor.primary}
                onChange={(e) => setAwayColor(prev => ({...prev, primary: e.target.value}))}
            />
            <Input
                id="awaySecondary"
                label="Secondary"
                type="color"
                value={awayColor.secondary}
                onChange={(e) => setAwayColor(prev => ({...prev, secondary: e.target.value}))}
            />
            <ExampleIcon actionType={ActionType.GOAL} backgroundColor={awayColor.primary} color={awayColor.secondary}/>
            
            {errors.colors && <span>{errors.colors}</span>}

            <h3>Championships:</h3>
            {Object.values(Championship).map((championship) => (
                <Checkbox
                    key={championship}
                    id={`champ-${championship}`}
                    label={championship}
                    checked={championships.includes(championship)}
                    onChange={() => toggleChampionship(championship)}
                />
            ))}
            {errors.championships && <span>{errors.championships}</span>}

            <div>
                <Button styleType={"positive"} type="submit">{submitLabel}</Button>
                <Button styleType={"negative"} type="button" onClick={onCancel}>
                    {initialData ? "Discard Changes" : "Go Back"}
                </Button>
            </div>
        </form>
    );
};

export default TeamForm;