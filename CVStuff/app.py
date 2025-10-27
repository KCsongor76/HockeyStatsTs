from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import json
import hashlib

from tracker import Tracker
from ml_model import HockeyActionDetector


from OOP.Team import Team

UPLOAD_FOLDER = "uploads"

app = Flask(__name__)
CORS(app)  # Allow React frontend to call Flask
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

app.config['EXCLUDE_PATTERNS'] = [
    '**/anaconda3/**',
    '**/site-packages/**',
    '**/__pycache__/**',
]

def read_video(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    return frames


def save_video(output_video_frames, output_video_path, fps=50):
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(output_video_path, fourcc, fps,
                          (output_video_frames[0].shape[1], output_video_frames[0].shape[0]))
    for frame in output_video_frames:
        out.write(frame)
    out.release()


# Initialize our action detector
action_detector = HockeyActionDetector()


def handle_file_upload(video_file):
    """
    Handles the file upload logic with duplicate detection.
    If the file already exists (based on content hash), returns the existing path.
    Otherwise, saves the new file with a unique name.
    """
    if not video_file or not video_file.filename:
        raise ValueError("No video file provided")

    # Read file content to compute hash
    video_content = video_file.read()
    video_file.seek(0)  # Reset file pointer for later use

    # Compute SHA-256 hash of file content
    file_hash = hashlib.sha256(video_content).hexdigest()

    # Check if file with same hash already exists
    for existing_file in os.listdir(app.config["UPLOAD_FOLDER"]):
        existing_path = os.path.join(app.config["UPLOAD_FOLDER"], existing_file)
        if os.path.isfile(existing_path):
            with open(existing_path, 'rb') as f:
                existing_hash = hashlib.sha256(f.read()).hexdigest()
                if existing_hash == file_hash:
                    print(f"File already exists: {existing_path}")
                    return existing_path

    # File doesn't exist, save it with unique name if needed
    original_filename = video_file.filename
    base_filename = os.path.splitext(original_filename)[0]
    extension = os.path.splitext(original_filename)[1]

    # Generate unique filename if it already exists
    counter = 1
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], original_filename)

    while os.path.exists(save_path):
        new_filename = f"{base_filename}_{counter}{extension}"
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], new_filename)
        counter += 1

        # Safety check to prevent infinite loop
        if counter > 1000:
            raise ValueError("Too many duplicate files")

    # Save the file
    video_file.save(save_path)
    print(f"New file saved: {save_path}")
    return save_path


@app.route("/upload-game", methods=["POST"])
def upload_game():
    if "video" not in request.files:
        return jsonify({"error": "No video file"}), 400

    video = request.files["video"]
    video_name = os.path.splitext(video.filename)[0]
    print(f"Video file name: uploads/{video_name}.mp4")
    video_frames = read_video(f'uploads/{video_name}.mp4')

    if len(video_frames) > 0:
        frame_height, frame_width = video_frames[0].shape[:2]
        frame_dimensions = (frame_height, frame_width)
        print(f"Frame dimensions: {frame_width}x{frame_height}")
    else:
        frame_dimensions = None
        print("No frames found in video")

    # initialize tracker
    tracker = Tracker('models/HockeyAI_model_weight.pt')
    tracks = tracker.get_object_tracks(video_frames, read_from_stub=True,
                                       stub_path=f'stubs/track_stubs_new_{video_name}.pkl')

    # Apply interpolation to puck positions
    tracks['puck'] = tracker.interpolate_puck_positions(tracks['puck'])

    # Get object positions
    tracker.add_position_to_tracks(tracks, frame_dimensions)

    # Draw output
    ## Draw object Tracks
    output_video_frames = tracker.draw_annotations(video_frames, tracks)

    # Save video
    save_video(output_video_frames, f'output_videos/{video_name}_C.avi')

    # Get team data as JSON objects
    team_home_json = request.form.get("team_home")
    team_away_json = request.form.get("team_away")

    if not team_home_json or not team_away_json:
        return jsonify({"error": "Team data missing"}), 400

    try:
        # Parse team data from JSON strings
        team_home_data = json.loads(team_home_json)
        team_away_data = json.loads(team_away_json)

        team_home = Team.from_dict(team_home_data)
        team_away = Team.from_dict(team_away_data)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid team data format"}), 400

    try:
        # Use the improved file handling function
        save_path = handle_file_upload(video)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to save video: {str(e)}"}), 500

    # Process video with ML model
    detected_actions, puck_positions = action_detector.process_video(save_path, team_home, team_away)

    # Convert actions to dict for JSON serialization
    actions_dict = [action.to_dict() for action in detected_actions]

    real_puck_positions = []
    # Iterate through all frames
    for frame_num in range(len(tracks['puck'])):
        frame_data = tracks['puck'][frame_num]

        if 1 in frame_data:  # Check if puck exists in this frame
            puck_data = frame_data[1]

            relative_pos = puck_data['relative_position']
            # real_puck_positions.append({
            #     'frame_number': frame_num,
            #     'relative_position': relative_pos,
            #     'x_normalized': relative_pos[0],
            #     'y_normalized': relative_pos[1]
            # })
            real_puck_positions.append([
                frame_num, relative_pos[0], relative_pos[1]
            ])

        else:
            continue
            # No puck detected in this frame
            # real_puck_positions.append({
            #     'frame_number': frame_num,
            #     'relative_position': None,
            #     'x_normalized': None,
            #     'y_normalized': None
            # })

    # Return the detected actions
    return jsonify({
        "status": "processed",
        "filename": os.path.basename(save_path),
        "actions": actions_dict,
        "puck_positions": real_puck_positions,  # Add this line
        "teams": {
            "home": team_home.to_dict(),
            "away": team_away.to_dict()
        },
    })


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
