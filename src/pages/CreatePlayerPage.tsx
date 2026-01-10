import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {PlayerService} from "../OOP/services/PlayerService";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import Input from "../components/Input";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";
import PlayerForm, {PlayerFormData} from "../components/forms/PlayerForm";
import styles from "./CreatePlayerPage.module.css";

const CreatePlayerPage = () => {
    const location = useLocation();
    const teams = location.state.teams as Team[];
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

    const submitHandler = async (data: PlayerFormData) => {
        const newErrors: Record<string, string> = {};

        const nameErr = Player.validateName(data.name);
        if (nameErr) newErrors.name = nameErr;

        const jerseyErr = Player.validateJerseyNumber(data.jerseyNumber);
        if (jerseyErr) newErrors.jerseyNumber = jerseyErr;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const player: IPlayer = {
                ...data,
                id: ""
            };

            await PlayerService.createPlayer(data.teamId, player);
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

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <h1 className={styles.title}>Create New Player</h1>
                
                <div className={styles.uploadSection}>
                    <h2 className={styles.sectionTitle}>Upload Players from File</h2>
                    <Input
                        id="fileUpload"
                        label="Upload player file (.txt) (Line 1: Header/Ignored, Line 2: TeamID, Line 3+: JerseyNumber | Name | Position):"
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                    />

                    {isUploading && <p className={styles.statusMessage}>Uploading players...</p>}
                    {uploadStatus && <p className={styles.statusMessage}>{uploadStatus}</p>}
                </div>

                <div>
                    <h2 className={styles.sectionTitle}>Create Player Manually</h2>
                    <PlayerForm
                        teams={teams}
                        showTeamSelector={true}
                        onSubmit={submitHandler}
                        onCancel={() => navigate(-1)}
                        submitLabel="Create player"
                        errors={errors}
                        setErrors={setErrors}
                    />
                </div>
            </div>
        </div>
    );
};

export default CreatePlayerPage;