import React, {useState} from 'react';
import {Position} from "../OOP/enums/Position";
import {useLocation, useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {PlayerService} from "../OOP/services/PlayerService";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import Button from "../components/Button";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";

const CreatePlayerPage = () => {
    const location = useLocation()
    const teams = location.state.teams as ITeam[];
    const [playerData, setPlayerData] = useState({
        name: '',
        position: Position.GOALIE,
        jerseyNumber: 1,
        teamId: teams[0].id,
    });
    const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const navigate = useNavigate();

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const trimmedName = playerData.name.trim();

        if (!trimmedName) {
            newErrors.name = 'Name is required';
        }

        if (isNaN(playerData.jerseyNumber)) {
            newErrors.jerseyNumber = 'Jersey number must be a number';
        } else if (playerData.jerseyNumber < 1 || playerData.jerseyNumber > 99) {
            newErrors.jerseyNumber = 'Jersey number must be between 1-99';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submitHandler = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;
        if (isFreeAgent) playerData.teamId = "free-agent";

        try {
            const isJerseyNumberAvailable = await PlayerService.isJerseyNumberAvailable(playerData.teamId, playerData.jerseyNumber)
            if (!isFreeAgent && !isJerseyNumberAvailable) {
                setErrors(prev => ({
                    ...prev,
                    jerseyNumber: `Jersey number ${playerData.jerseyNumber} is already taken`
                }));
                return;
            }
            const player = {...playerData, id: ""} as IPlayer;
            await PlayerService.createPlayer(player.teamId, player);
            alert('Player created successfully!');
            navigate(`/${HANDLE_PLAYERS}`)
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                general: 'Failed to create player. Please try again.'
            }));
            console.error('Failed to create player:', error);
        }
    }

    const mapPositionString = (positionStr: string): Position => {
        const lowerPosition = positionStr.toLowerCase();
        switch (lowerPosition) {
            case 'goalie':
            case 'goalkeeper':
                return Position.GOALIE;
            case 'defender':
            case 'defence':
                return Position.DEFENDER;
            case 'forward':
            case 'attacker':
                return Position.FORWARD;
            default:
                throw new Error(`Unknown position: ${positionStr}`);
        }
    }

    const parsePlayerFile = (content: string): {
        teamId: string;
        players: Array<{ jerseyNumber: number; name: string; position: Position }>
    } => {
        const lines = content.split('\n').filter(line => line.trim() !== '');

        if (lines.length < 3) {
            throw new Error('Invalid file format. File must have at least 3 lines.');
        }

        // Second line: team ID
        const teamId = lines[1].trim();

        // Remaining lines: player data
        const playerLines = lines.slice(2);
        const players = playerLines.map(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length !== 3) {
                throw new Error(`Invalid player data format: ${line}`);
            }

            const jerseyNumber = parseInt(parts[0]);
            if (isNaN(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
                throw new Error(`Invalid jersey number: ${parts[0]}`);
            }

            const name = parts[1];
            const position = mapPositionString(parts[2]);

            return {jerseyNumber, name, position};
        });

        return {teamId, players};
    }


    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if file is a text file
        if (!file.name.toLowerCase().endsWith('.txt')) {
            setUploadStatus('Error: Please upload a .txt file');
            return;
        }

        setIsUploading(true);
        setUploadStatus('');

        try {
            const content = await readFileAsText(file);
            const {teamId, players} = parsePlayerFile(content);

            let successCount = 0;
            let errorCount = 0;

            // Upload each player
            for (const playerData of players) {
                try {
                    const isAvailable = true
                    if (isAvailable) {
                        const player: IPlayer = {
                            id: "",
                            name: playerData.name,
                            position: playerData.position,
                            jerseyNumber: playerData.jerseyNumber,
                            teamId: teamId
                        };

                        await PlayerService.createPlayer(teamId, player);
                        successCount++;
                    } else {
                        console.warn(`Jersey number ${playerData.jerseyNumber} is already taken for player ${playerData.name}`);
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Failed to create player ${playerData.name}:`, error);
                    errorCount++;
                }
            }

            setUploadStatus(`Upload completed: ${successCount} players added successfully, ${errorCount} failed.`);

            if (successCount > 0) {
                setTimeout(() => {
                    navigate(`/${HANDLE_PLAYERS}`);
                }, 200);
            }

        } catch (error) {
            console.error('Error processing file:', error);
            setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Failed to process file'}`);
        } finally {
            setIsUploading(false);
            // Clear file input
            event.target.value = '';
        }
    }

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
    }

    return (
        <div>
            <h1>Create New Player</h1>

            <div>
                <h2>Upload Players from File</h2>
                <div>
                    <label htmlFor="fileUpload">Upload player file (.txt):</label>
                    <input
                        id="fileUpload"
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                    />
                </div>
                {isUploading && <p>Uploading players...</p>}
                {uploadStatus && (
                    <p>
                        {uploadStatus}
                    </p>
                )}
            </div>

            <hr/>

            {/* Manual Player Creation Form */}
            <h2>Create Player Manually</h2>
            <form onSubmit={submitHandler}>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input
                        id="name"
                        type="text"
                        value={playerData.name}
                        onChange={(e) => {
                            setPlayerData(prev => ({...prev, name: e.target.value}))
                            setErrors(prev => ({...prev, name: ''}))
                        }}
                        required
                    />
                    {errors.name && <span>{errors.name}</span>}
                </div>

                <div>
                    <label htmlFor="jerseyNumber">Jersey number:</label>
                    <input
                        id="jerseyNumber"
                        type="number"
                        value={playerData.jerseyNumber}
                        onChange={(e) => {
                            setPlayerData(prev => ({...prev, jerseyNumber: Number(e.target.value)}))
                            setErrors(prev => ({...prev, jerseyNumber: ''}))
                        }}
                        required
                        min={1}
                        max={99}
                    />
                    {errors.jerseyNumber && <span>{errors.jerseyNumber}</span>}
                </div>

                <div>
                    <label htmlFor="position">Position:</label>
                    <select
                        id="position"
                        value={playerData.position}
                        onChange={(e) => setPlayerData(prev => ({...prev, position: e.target.value as Position}))}
                    >
                        {Object.values(Position).map(position => (
                            <option key={position} value={position}>{position}</option>
                        ))}
                    </select>
                </div>

                {/* Fixed checkbox with proper styling */}
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={isFreeAgent}
                            onChange={() => setIsFreeAgent(!isFreeAgent)}
                        />
                        <span>
                            Free Agent
                        </span>
                    </label>
                </div>

                {!isFreeAgent && (
                    <div>
                        <label htmlFor="team">Team:</label>
                        <select
                            id="team"
                            value={playerData.teamId}
                            onChange={(e) => setPlayerData(prev => ({...prev, teamId: e.target.value}))}
                        >
                            {teams.filter(team => team.id !== "free-agent").map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {errors.general && <span>{errors.general}</span>}

                <div>
                    <Button styleType={"positive"} type="submit">Create player</Button>
                    <Button styleType={"negative"} type="button" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlayerPage;