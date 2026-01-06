import React, {useState} from 'react';
import Button from "../components/Button";
import {useLoaderData, useNavigate} from "react-router-dom";
import {CREATE} from "../OOP/constants/NavigationNames";
import {Team} from "../OOP/classes/Team";
import {TeamService} from "../OOP/services/TeamService";


const TeamCrudPage2 = () => {
    const loaderData = useLoaderData() as Team[];
    const [teams, setTeams] = useState<Team[]>(loaderData ?? []);

    const navigate = useNavigate();

    const deleteHandler = async (team: Team) => {
        if (window.confirm(`Are you sure you want to delete ${team.name}?`)) {
            try {
                await TeamService.deleteTeam(team.id);
                // Update local state to reflect deletion without reloading
                setTeams(prev => prev.filter(t => t.id !== team.id));
            } catch (error) {
                console.error("Failed to delete team", error);
                alert("Failed to delete team.");
            }
        }
    };

    return (
        <>
            <Button
                styleType={"positive"}
                onClick={() => navigate(CREATE, {state: {teams}})}
            >
                Create new Team
            </Button>

            <div>
                {/*todo*/}
                {/*  search by name  */}
                {/*  search by season  */}
                {/*  search by championship  */}
            </div>

            <ul>
                {teams.length > 0
                    ? teams.map((team: Team) => (
                        <li key={team.id}>
                            {team.name}

                            <Button
                                styleType={"positive"}
                                onClick={() => navigate(`${team.id}`, {state: {team}})}
                            >
                                View
                            </Button>

                            <Button
                                styleType={"neutral"}
                                onClick={() => navigate(`${team.id}/edit`, {state: {team}})}
                            >
                                Edit
                            </Button>

                            <Button
                                styleType={"negative"}
                                onClick={() => deleteHandler(team)}
                            >
                                Delete
                            </Button>
                        </li>
                    ))
                    : <p>No teams found.</p>}
            </ul>

            {/*todo*/}
            {/*<Pagination pagination={} totalPages={} setPagination={} />*/}
            <Button styleType={"negative"} onClick={() => {
                navigate(-1)
            }}>Go Back</Button>
        </>
    );
};

export default TeamCrudPage2;

export const loader = async (): Promise<Team[]> => {
    return await TeamService.getAllTeams();
}