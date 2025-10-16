import React, {useState} from "react";
import StartPage from "./StartPage";
import PuckHeatmap from "../components/PuckHeatMap";
import Button from "../components/Button";

interface PuckPosition {
    time: number;
    x: number;
    y: number;
}

const UploadGamePage = () => {
    const [puckPositions, setPuckPositions] = useState<PuckPosition[]>([]);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const handleUploadSuccess = (data: any) => {
        if (data.puck_positions) {
            setPuckPositions(data.puck_positions);
        }
    };

    return (
        <div>
            <h2>Upload Hockey Game Video</h2>
            <StartPage
                isUpload={true}
                onUploadSuccess={handleUploadSuccess}
            />

            {puckPositions.length > 0 && (
                <div style={{marginTop: '2rem', padding: '1rem'}}>
                    <Button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        styleType={showHeatmap ? "negative" : "positive"}
                    >
                        {showHeatmap ? 'Hide' : 'Show'} Puck Heatmap
                    </Button>

                    {showHeatmap && (
                        <div style={{marginTop: '1rem'}}>
                            <PuckHeatmap puckPositions={puckPositions}/>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UploadGamePage;