import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import TeamForm, {TeamFormData} from "../components/forms/TeamForm";

const CreateTeamPage = () => {
    const location = useLocation();
    const teams = location.state.teams as ITeam[];
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const submitHandler = async (data: TeamFormData) => {
        const nameError = Team.validateName(data.name, teams);
        if (nameError) {
            setErrors(prev => ({...prev, name: nameError}));
            return;
        }

        if (!data.logoFile) {
            setErrors(prev => ({...prev, logo: "Logo is required"}));
            return;
        }

        const logoNameError = await Team.validateLogoFileName(data.logoFile.name);
        if (logoNameError) {
            setErrors(prev => ({...prev, logo: logoNameError}));
            return;
        }

        const colorsError = Team.validateColors(data.homeColor, data.awayColor);
        if (colorsError) {
            setErrors(prev => ({...prev, color: colorsError}));
            return;
        }

        const championshipsError = Team.validateChampionships(data.championships);
        if (championshipsError) {
            setErrors(prev => ({...prev, championshipsError}));
            return;
        }

        try {
            const logo = await TeamService.uploadLogo(data.logoFile);
            const newTeamData = {
                name: data.name,
                logo,
                homeColor: data.homeColor,
                awayColor: data.awayColor,
                championships: data.championships
            };
            await TeamService.createTeam(newTeamData);

            alert("Team created successfully!");
            navigate("../");
        } catch (error) {
            alert(`Error creating team: ${error}`);
            console.error("Error creating team:", error);
            setErrors(prev => ({...prev, general: "Failed to create team. Please try again."}));
        }
    };

    return (
        <div>
            <h1>Create New Team</h1>
            {errors.general && <div>{errors.general}</div>}
            <TeamForm
                onSubmit={submitHandler}
                onCancel={() => navigate("../")}
                submitLabel="Create Team"
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
};

export default CreateTeamPage;