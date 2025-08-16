import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {Championship} from "../OOP/enums/Championship";
import {Team} from "../OOP/classes/Team";
import {TeamService} from "../OOP/services/TeamService";

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
            const allowedTypes = ['image/jpeg', 'image/png'];

            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({...prev, logo: 'Only .jpg and .png formats are allowed'}));
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({...prev, logo: "Logo must be less than 2MB"}));
                return;
            }

            setLogoFile(file);
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

        const logoError = await Team.validateLogo(logoFile.name);
        if (logoError) {
            setErrors(prev => ({...prev, logo: logoError}));
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

            // Handle successful creation (redirect or show success message)
            console.log("Team created successfully");
            alert("Team created successfully!");
            navigate("../")
        } catch (error) {
            alert(`Error creating team: ${error}`);
            console.error("Error creating team:", error);
            setErrors(prev => ({...prev, general: "Failed to create team. Please try again."}));
        }
    };

    return (
        <form onSubmit={submitHandler}>
            {errors.general && <div className="error">{errors.general}</div>}

            <label>
                Team Name:
                <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                {errors.name && <span className="error">{errors.name}</span>}
            </label>

            <label>
                Team Logo:
                <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    required
                />
                {errors.logo && <span className="error">{errors.logo}</span>}
            </label>

            <label>
                Team Home Colors:
                <label>Primary</label>
                <input
                    type="color"
                    name="homePrimary"
                    value={homeColor.primary}
                    onChange={(e) => setHomeColor(prev => ({...prev, primary: e.target.value}))}
                />

                <label>Secondary</label>
                <input
                    type="color"
                    name="homeSecondary"
                    value={homeColor.secondary}
                    onChange={(e) => setHomeColor(prev => ({...prev, secondary: e.target.value}))}
                />
                {errors.colors && <span className="error">{errors.colors}</span>}
            </label>

            <label>
                Team Away Colors:
                <label>Primary</label>
                <input
                    type="color"
                    name="awayPrimary"
                    value={awayColor.primary}
                    onChange={(e) => setAwayColor(prev => ({...prev, primary: e.target.value}))}
                />

                <label>Secondary</label>
                <input
                    type="color"
                    name="awaySecondary"
                    value={awayColor.secondary}
                    onChange={(e) => setAwayColor(prev => ({...prev, secondary: e.target.value}))}
                />
            </label>

            <label>
                Championships:
                {Object.values(Championship).map((championship) => (
                    <div key={championship}>
                        <input
                            type="checkbox"
                            id={`champ-${championship}`}
                            checked={championships.includes(championship)}
                            onChange={() => toggleChampionship(championship)}
                        />
                        <label htmlFor={`champ-${championship}`}>{championship}</label>
                    </div>
                ))}
                {errors.championships && <span className="error">{errors.championships}</span>}
            </label>

            <button type="submit">Create Team</button>
            <button type="button" onClick={() => navigate("../")}>Go Back</button>
        </form>
    );
};

export default CreateTeamPage;