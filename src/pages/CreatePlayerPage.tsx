import React, {useState} from 'react';
import {Position} from "../OOP/enums/Position";
import {useLocation, useNavigate} from "react-router-dom";
import {PlayerService} from "../OOP/services/PlayerService";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Checkbox from "../components/Checkbox";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";

const CreatePlayerPage = () => {
    const location = useLocation();
    const teams = location.state.teams as Team[];

    const [playerData, setPlayerData] = useState({
        name: '',
        position: Position.GOALIE,
        jerseyNumber: 1,
        teamId: teams[0]?.id || '',
    });

    const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.txt')) {
            setUploadStatus('Error: Please upload a .txt file');
            return;
        }

        setIsUploading(true);
        setUploadStatus('');

        try {
            const content = await readFileAsText(file);
            const {teamId, players} = Player.parsePlayerFile(content);

            let successCount = 0;
            let errorCount = 0;

            for (const pData of players) {
                try {
                    const newPlayer: IPlayer = {
                        id: "",
                        name: pData.name,
                        position: pData.position,
                        jerseyNumber: pData.jerseyNumber,
                        teamId: teamId
                    };

                    await PlayerService.createPlayer(teamId, newPlayer);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to create player ${pData.name}:`, error);
                    errorCount++;
                }
            }

            setUploadStatus(`Upload completed: ${successCount} players added successfully, ${errorCount} failed.`);

            if (successCount > 0) {
                setTimeout(() => {
                    navigate(`/${HANDLE_PLAYERS}`);
                }, 2000);
            }

        } catch (error) {
            console.error('Error processing file:', error);
            setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Failed to process file'}`);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                resolve(content);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const submitHandler = async (event: React.FormEvent) => {
        event.preventDefault();

        const newErrors: Record<string, string> = {};

        const nameErr = Player.validateName(playerData.name);
        if (nameErr) newErrors.name = nameErr;

        const jerseyErr = Player.validateJerseyNumber(playerData.jerseyNumber);
        if (jerseyErr) newErrors.jerseyNumber = jerseyErr;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const targetTeamId = isFreeAgent ? "free-agent" : playerData.teamId;

        try {
            const player: IPlayer = {
                ...playerData,
                teamId: targetTeamId,
                id: ""
            };

            await PlayerService.createPlayer(targetTeamId, player);
            alert('Player created successfully!');
            navigate(`/${HANDLE_PLAYERS}`);
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                general: 'Failed to create player. Please try again.'
            }));
            console.error('Failed to create player:', error);
        }
    };

    const positionOptions = Object.values(Position).map(p => ({value: p, label: p}));
    const teamOptions = teams
        .filter(team => team.id !== "free-agent")
        .map(team => ({value: team.id, label: team.name}));

    return (
        <>
            <h1>Create New Player</h1>
            <h2>Upload Players from File</h2>

            <Input
                id="fileUpload"
                label="Upload player file (.txt) (Line 1: Header/Ignored, Line 2: TeamID, Line 3+: JerseyNumber | Name | Position):"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
            />

            {isUploading && <p>Uploading players...</p>}
            {uploadStatus && <p>{uploadStatus}</p>}

            <h2>Create Player Manually</h2>
            <form onSubmit={submitHandler}>
                <Input
                    id="name"
                    label="Name:"
                    type="text"
                    value={playerData.name}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, name: e.target.value}));
                        setErrors(prev => ({...prev, name: ''}));
                    }}
                    required
                    error={errors.name}
                />

                <Input
                    id="jerseyNumber"
                    label="Jersey number:"
                    type="number"
                    value={playerData.jerseyNumber}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, jerseyNumber: Number(e.target.value)}));
                        setErrors(prev => ({...prev, jerseyNumber: ''}));
                    }}
                    required
                    min={1}
                    max={99}
                    error={errors.jerseyNumber}
                />

                <Select
                    id="position"
                    label="Position:"
                    value={playerData.position}
                    onChange={(e) => setPlayerData(prev => ({...prev, position: e.target.value as Position}))}
                    options={positionOptions}
                />

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
                        value={playerData.teamId}
                        onChange={(e) => setPlayerData(prev => ({...prev, teamId: e.target.value}))}
                        options={teamOptions}
                    />
                )}

                {errors.general && <span>{errors.general}</span>}

                <div>
                    <Button styleType={"positive"} type="submit">Create player</Button>
                    <Button styleType={"negative"} type="button" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </form>
        </>
    );
};

export default CreatePlayerPage;