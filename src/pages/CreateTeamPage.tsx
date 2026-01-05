import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {Championship} from "../OOP/enums/Championship";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import Button from "../components/Button";
import styles from "./CreateTeamPage.module.css";
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
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>Create New Team</h1>
            <form onSubmit={submitHandler}>
                {errors.general && <div className="error">{errors.general}</div>}

                <div className={styles.inputContainer}>
                    <label htmlFor="name" className={styles.label}>
                        Team Name:
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`${styles.input} ${errors.name ? styles.error : ''}`}
                    />
                    {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                </div>

                <div className={styles.inputContainer}>
                    <label htmlFor="logo" className={styles.label}>
                        Team Logo:
                    </label>
                    <input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        required
                        className={`${styles.input} ${errors.logo ? styles.error : ''}`}
                    />
                    {errors.logo && <span className={styles.errorMessage}>{errors.logo}</span>}
                </div>

                <div className={styles.colorGroup}>
                    <div>
                        <label>Team Home Colors:</label>
                        <div className={styles.inputContainer}>
                            <label htmlFor="homePrimary" className={styles.label}>Primary</label>
                            <input
                                id="homePrimary"
                                name="homePrimary"
                                type="color"
                                value={homeColor.primary}
                                onChange={(e) => setHomeColor(prev => ({...prev, primary: e.target.value}))}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.inputContainer}>
                            <label htmlFor="homeSecondary" className={styles.label}>Secondary</label>
                            <input
                                id="homeSecondary"
                                name="homeSecondary"
                                type="color"
                                value={homeColor.secondary}
                                onChange={(e) => setHomeColor(prev => ({...prev, secondary: e.target.value}))}
                                className={styles.input}
                            />
                        </div>
                        <ExampleIcon
                            actionType={ActionType.GOAL}
                            backgroundColor={homeColor.primary}
                            color={homeColor.secondary}
                        />
                        {errors.colors && <span className="error">{errors.colors}</span>}
                    </div>

                    <div>
                        <label>Team Away Colors:</label>
                        <div className={styles.inputContainer}>
                            <label htmlFor="awayPrimary" className={styles.label}>Primary</label>
                            <input
                                id="awayPrimary"
                                name="awayPrimary"
                                type="color"
                                value={awayColor.primary}
                                onChange={(e) => setAwayColor(prev => ({...prev, primary: e.target.value}))}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.inputContainer}>
                            <label htmlFor="awaySecondary" className={styles.label}>Secondary</label>
                            <input
                                id="awaySecondary"
                                name="awaySecondary"
                                type="color"
                                value={awayColor.secondary}
                                onChange={(e) => setAwayColor(prev => ({...prev, secondary: e.target.value}))}
                                className={styles.input}
                            />
                        </div>
                        <ExampleIcon
                            actionType={ActionType.GOAL}
                            backgroundColor={awayColor.primary}
                            color={awayColor.secondary}
                        />
                    </div>
                </div>

                <div className={styles.championshipGroup}>
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

                <div className={styles.buttonGroup}>
                    <Button styleType={"positive"} type="submit">Create Team</Button>
                    <Button styleType={"negative"} type="button" onClick={() => navigate("../")}>Go Back</Button>
                </div>
            </form>
        </div>
    );
};

export default CreateTeamPage;