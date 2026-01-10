import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import TeamForm, {TeamFormData} from "../components/forms/TeamForm";
import styles from "./EditTeamPage.module.css";

const EditTeamPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [team] = useState<Team>(() => new Team(location.state.team as ITeam));
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSave = async (data: TeamFormData) => {
        try {
            const nameError = await TeamService.isNameTaken(data.name, team.id) ? "Team name is already taken" : null;
            if (nameError) {
                setErrors(prev => ({...prev, name: nameError}));
                return;
            }

            if (data.logoFile) {
                const fileNameError = await Team.validateLogoFileName(data.logoFile.name, team.logo);
                if (fileNameError) {
                    setErrors(prev => ({...prev, logo: fileNameError}));
                    return;
                }
            }

            const championshipsError = Team.validateChampionships(data.championships);
            if (championshipsError) {
                setErrors(prev => ({...prev, championships: championshipsError}));
                return;
            }

            let logoUrl = team.logo;
            if (data.logoFile) {
                if (team.logo) await TeamService.deleteLogo(team.logo);
                logoUrl = await TeamService.uploadLogo(data.logoFile);
            }

            const updatedTeam = new Team({...team, ...data, logo: logoUrl});
            await TeamService.updateTeam(team.id, updatedTeam);
            navigate(-1);
        } catch (error) {
            console.error('Error updating team:', error);
            setErrors(prev => ({...prev, general: "Failed to update team. Please try again."}));
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.formCard}>
                <div className={styles.header}>
                    {team.logo && team.id !== 'free-agent' && (<img src={team.logo} alt={team.name} className={styles.logo}/>)}
                    <h1 className={styles.title}>Edit {team.name}</h1>
                </div>
                {errors.general && <div className={styles.errorContainer}>{errors.general}</div>}
                <TeamForm
                    initialData={team}
                    onSubmit={handleSave}
                    onCancel={() => navigate(-1)}
                    submitLabel="Save Changes"
                    errors={errors}
                    setErrors={setErrors}
                />
            </div>
        </div>
    );
};

export default EditTeamPage;