import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {Championship} from "../OOP/enums/Championship";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import Button from "../components/Button";
import {ActionType} from "../OOP/enums/ActionType";
import ExampleIcon from "../components/ExampleIcon";

const CreateTeamPage = () => {
    const location = useLocation()
    const teams = location.state.teams as ITeam[];
    const [name, setName] = useState<string>("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [homeColor, setHomeColor] = useState({primary: "#ffffff", secondary: "#000000"});
    const [awayColor, setAwayColor] = useState({primary: "#ffffff", secondary: "#000000"});
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const error = Team.validateLogoFile(file);

            if (error) {
                setErrors(prev => ({...prev, logo: error}));
                return;
            }

            setLogoFile(file);
            setErrors(prev => ({...prev, logo: ''}));
        }
    };

    const toggleChampionship = (championship: Championship) => {
        setChampionships(prev =>
            prev.includes(championship)
                ? prev.filter(c => c !== championship)
                : [...prev, championship]
        );
    };

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameError = Team.validateName(name, teams);
        if (nameError) {
            setErrors(prev => ({...prev, name: nameError}));
            return;
        }

        if (!logoFile) {
            setErrors(prev => ({...prev, logo: "Logo is required"}));
            return;
        }

        const logoNameError = await Team.validateLogoFileName(logoFile.name);
        if (logoNameError) {
            setErrors(prev => ({...prev, logo: logoNameError}));
            return;
        }

        const colorsError = Team.validateColors(homeColor, awayColor);
        if (colorsError) {
            setErrors(prev => ({...prev, color: colorsError}));
            return;
        }

        const championshipsError = Team.validateChampionships(championships);
        if (championshipsError) {
            setErrors(prev => ({...prev, championshipsError}));
            return;
        }

        try {
            const logo = await TeamService.uploadLogo(logoFile)
            const newTeamData = {
                name,
                logo,
                homeColor,
                awayColor,
                championships
            };
            await TeamService.createTeam(newTeamData);

            alert("Team created successfully!");
            navigate("../")
        } catch (error) {
            alert(`Error creating team: ${error}`);
            console.error("Error creating team:", error);
            setErrors(prev => ({...prev, general: "Failed to create team. Please try again."}));
        }
    };

    return (
        <div>
            <h1>Create New Team</h1>
            <form onSubmit={submitHandler}>
                {errors.general && <div>{errors.general}</div>}

                <div>
                    <label htmlFor="name">
                        Team Name:
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    {errors.name && <span>{errors.name}</span>}
                </div>

                <div>
                    <label htmlFor="logo">
                        Team Logo:
                    </label>
                    <input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        required
                    />
                    {errors.logo && <span>{errors.logo}</span>}
                </div>

                <div>
                    <div>
                        <label>Team Home Colors:</label>
                        <div>
                            <label htmlFor="homePrimary">Primary</label>
                            <input
                                id="homePrimary"
                                name="homePrimary"
                                type="color"
                                value={homeColor.primary}
                                onChange={(e) => setHomeColor(prev => ({...prev, primary: e.target.value}))}
                            />
                        </div>

                        <div>
                            <label htmlFor="homeSecondary">Secondary</label>
                            <input
                                id="homeSecondary"
                                name="homeSecondary"
                                type="color"
                                value={homeColor.secondary}
                                onChange={(e) => setHomeColor(prev => ({...prev, secondary: e.target.value}))}
                            />
                        </div>
                        <ExampleIcon
                            actionType={ActionType.GOAL}
                            backgroundColor={homeColor.primary}
                            color={homeColor.secondary}
                        />
                        {errors.colors && <span>{errors.colors}</span>}
                    </div>

                    <div>
                        <label>Team Away Colors:</label>
                        <div>
                            <label htmlFor="awayPrimary">Primary</label>
                            <input
                                id="awayPrimary"
                                name="awayPrimary"
                                type="color"
                                value={awayColor.primary}
                                onChange={(e) => setAwayColor(prev => ({...prev, primary: e.target.value}))}
                            />
                        </div>

                        <div>
                            <label htmlFor="awaySecondary">Secondary</label>
                            <input
                                id="awaySecondary"
                                name="awaySecondary"
                                type="color"
                                value={awayColor.secondary}
                                onChange={(e) => setAwayColor(prev => ({...prev, secondary: e.target.value}))}
                            />
                        </div>
                        <ExampleIcon
                            actionType={ActionType.GOAL}
                            backgroundColor={awayColor.primary}
                            color={awayColor.secondary}
                        />
                    </div>
                </div>

                <div>
                    <label>Championships:</label>
                    {Object.values(Championship).map((championship) => (
                        <label key={championship}>
                            {championship}
                            <input
                                type="checkbox"
                                id={`champ-${championship}`}
                                checked={championships.includes(championship)}
                                onChange={() => toggleChampionship(championship)}
                            />
                        </label>
                    ))}
                </div>

                <div>
                    <Button styleType={"positive"} type="submit">Create Team</Button>
                    <Button styleType={"negative"} type="button" onClick={() => navigate("../")}>Go Back</Button>
                </div>
            </form>
        </div>
    );
};

export default CreateTeamPage;