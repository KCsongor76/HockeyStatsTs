import cv2
from ultralytics import YOLO
import supervision as sv
import pickle
import numpy as np
import pandas as pd
import os
import sys

sys.path.append('/')


def get_center_of_bbox(bbox):
    x1, y1, x2, y2 = bbox
    return int((x1 + x2) / 2), int((y1 + y2) / 2)


def get_bbox_width(bbox):
    return bbox[2] - bbox[0]


def measure_distance(p1, p2):
    return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5


def measure_xy_distance(p1, p2):
    return p1[0] - p2[0], p1[1] - p2[1]


def get_foot_position(bbox):
    x1, y1, x2, y2 = bbox
    return int((x1 + x2) / 2), int(y2)


class Tracker:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        self.tracker = sv.ByteTrack()

    def add_position_to_tracks(self, tracks, frame_dimensions=None):
        for object, object_tracks in tracks.items():
            for frame_num, track in enumerate(object_tracks):
                for track_id, track_info in track.items():
                    bbox = track_info['bbox']

                    # Get absolute position
                    if object == 'puck':
                        abs_position = get_center_of_bbox(bbox)
                    else:
                        abs_position = get_foot_position(bbox)

                    tracks[object][frame_num][track_id]['position'] = abs_position

                    # Add relative position if frame dimensions are provided
                    if frame_dimensions is not None:
                        frame_height, frame_width = frame_dimensions
                        rel_x = abs_position[0] / frame_width
                        rel_y = abs_position[1] / frame_height
                        tracks[object][frame_num][track_id]['relative_position'] = (rel_x, rel_y)

    # def interpolate_puck_positions(self, puck_positions):
    #     puck_positions = [x.get(1, {}).get('bbox', []) for x in puck_positions]
    #     df_puck_positions = pd.DataFrame(puck_positions, columns=['x1', 'y1', 'x2', 'y2'])
    #
    #     # Interpolate missing values
    #     df_puck_positions = df_puck_positions.interpolate()
    #     df_puck_positions = df_puck_positions.bfill()
    #
    #     puck_positions = [{1: {"bbox": x}} for x in df_puck_positions.to_numpy().tolist()]
    #
    #     return puck_positions

    def interpolate_puck_positions(self, puck_positions):
        # Extract bboxes, using empty list for missing detections
        bboxes = []
        for frame_data in puck_positions:
            if 1 in frame_data and 'bbox' in frame_data[1]:
                bboxes.append(frame_data[1]['bbox'])
            else:
                bboxes.append([])  # Empty for missing frames

        # Convert to DataFrame for interpolation
        df = pd.DataFrame(bboxes, columns=['x1', 'y1', 'x2', 'y2'])

        # Interpolate missing values
        df = df.interpolate(method='linear', limit=5, limit_direction='both')
        df = df.bfill().ffill()  # Fill any remaining NaNs

        # Convert back to original format
        interpolated_puck_positions = []
        for i, row in df.iterrows():
            if not np.isnan(row['x1']):
                interpolated_puck_positions.append({1: {"bbox": row.values.tolist()}})
            else:
                interpolated_puck_positions.append({})  # Keep empty if still missing

        return interpolated_puck_positions

    def detect_frames(self, frames):
        batch_size = 20
        detections = [None] * len(frames)  # Pre-allocate list with correct length

        for i in range(0, len(frames), batch_size):
            end_idx = min(i + batch_size, len(frames))
            detections_batch = self.model.predict(frames[i:end_idx], conf=0.1)

            # Assign each detection to the correct frame index
            for j, detection in enumerate(detections_batch):
                detections[i + j] = detection

        return detections

    # def detect_frames(self, frames):
    #     detections = []
    #     for frame in frames:
    #         detection = self.model.predict(frame, conf=0.1)[0]  # Get first (and only) result
    #         detections.append(detection)
    #     return detections

    # def get_object_tracks(self, frames, read_from_stub=False, stub_path=None):
    #     if read_from_stub and stub_path is not None and os.path.exists(stub_path):
    #         with open(stub_path, 'rb') as f:
    #             tracks = pickle.load(f)
    #         return tracks
    #
    #     detections = self.detect_frames(frames)
    #
    #     tracks = {
    #         "players": [],
    #         "referees": [],
    #         "puck": []
    #     }
    #
    #     for frame_num, detection in enumerate(detections):
    #         class_names = detection.names
    #         class_names_inverse = {v: k for k, v in class_names.items()}  # todo: expand to normal for loop
    #
    #         # convert to supervision detection format
    #         detection_supervision = sv.Detections.from_ultralytics(detection)
    #
    #         # convert human to player
    #         # convert goalie to player
    #         for object_id, class_id in enumerate(detection_supervision.class_id):
    #             if class_names[class_id] == "goalie" or class_names[class_id] == "human":
    #                 detection_supervision.class_id[object_id] = class_names_inverse["player"]
    #
    #         # Track Objects
    #         detection_with_tracks = self.tracker.update_with_detections(detection_supervision)
    #
    #         tracks["players"].append({})
    #         tracks["referees"].append({})
    #         tracks["puck"].append({})
    #
    #         for frame_detection in detection_with_tracks:
    #             bbox = frame_detection[0].tolist()
    #             class_id = frame_detection[3]
    #             track_id = frame_detection[4]
    #
    #             if class_id == class_names_inverse["player"]:
    #                 tracks["players"][frame_num][track_id] = {"bbox": bbox}
    #             if class_id == class_names_inverse["referee"]:
    #                 tracks["referees"][frame_num][track_id] = {"bbox": bbox}
    #
    #         # for frame_detection in detection_supervision:
    #         #     bbox = frame_detection[0].tolist()
    #         #     class_id = frame_detection[3]
    #         #
    #         #     if class_id == class_names_inverse["puck"]:
    #         #         tracks["puck"][frame_num][1] = {"bbox": bbox}
    #
    #         for frame_detection in detection_supervision:
    #             bbox = frame_detection[0].tolist()
    #             class_id = frame_detection[3]
    #             confidence = frame_detection[2]  # Get confidence score
    #
    #             if class_id == class_names_inverse["puck"]:
    #                 # Only keep the detection if confidence is above a threshold
    #                 if confidence > 0.3:  # Adjust this threshold as needed
    #                     # Store with confidence for later comparison
    #                     if 1 not in tracks["puck"][frame_num] or confidence > tracks["puck"][frame_num][1].get(
    #                             "confidence", 0):
    #                         tracks["puck"][frame_num][1] = {"bbox": bbox, "confidence": confidence}
    #
    #     if stub_path is not None:
    #         with open(stub_path, "wb") as f:
    #             pickle.dump(tracks, f)
    #
    #     return tracks

    def get_object_tracks(self, frames, read_from_stub=False, stub_path=None):
        if read_from_stub and stub_path is not None and os.path.exists(stub_path):
            with open(stub_path, 'rb') as f:
                tracks = pickle.load(f)
            return tracks

        detections = self.detect_frames(frames)

        # Initialize tracks with correct length
        num_frames = len(frames)
        tracks = {
            "players": [{} for _ in range(num_frames)],
            "referees": [{} for _ in range(num_frames)],
            "puck": [{} for _ in range(num_frames)]
        }

        for frame_num, detection in enumerate(detections):
            if detection is None:
                continue  # Skip if no detection for this frame

            class_names = detection.names
            class_names_inverse = {v: k for k, v in class_names.items()}

            # convert to supervision detection format
            detection_supervision = sv.Detections.from_ultralytics(detection)

            # convert human to player, goalie to player
            for object_id, class_id in enumerate(detection_supervision.class_id):
                if class_names[class_id] == "goalie" or class_names[class_id] == "human":
                    detection_supervision.class_id[object_id] = class_names_inverse["player"]

            # Track Objects
            detection_with_tracks = self.tracker.update_with_detections(detection_supervision)

            for frame_detection in detection_with_tracks:
                bbox = frame_detection[0].tolist()
                class_id = frame_detection[3]
                track_id = frame_detection[4]

                if class_id == class_names_inverse["player"]:
                    tracks["players"][frame_num][track_id] = {"bbox": bbox}
                if class_id == class_names_inverse["referee"]:
                    tracks["referees"][frame_num][track_id] = {"bbox": bbox}

            for frame_detection in detection_supervision:
                bbox = frame_detection[0].tolist()
                class_id = frame_detection[3]
                confidence = frame_detection[2]

                if class_id == class_names_inverse["puck"]:
                    if confidence > 0.3:
                        if 1 not in tracks["puck"][frame_num] or confidence > tracks["puck"][frame_num][1].get(
                                "confidence", 0):
                            tracks["puck"][frame_num][1] = {"bbox": bbox, "confidence": confidence}

        if stub_path is not None:
            with open(stub_path, "wb") as f:
                pickle.dump(tracks, f)

        return tracks

    def draw_ellipse(self, frame, bbox, color, track_id=None):
        y2 = int(bbox[3])
        x_center, _ = get_center_of_bbox(bbox)
        width = get_bbox_width(bbox)

        cv2.ellipse(
            frame,
            center=(x_center, y2),
            axes=(int(width), int(0.35 * width)),
            angle=0.0,
            startAngle=-45,
            endAngle=235,
            color=color,
            thickness=2,
            lineType=cv2.LINE_4
        )

        rectangle_width = 40
        rectangle_height = 20
        x1_rect = x_center - rectangle_width // 2
        x2_rect = x_center + rectangle_width // 2
        y1_rect = (y2 - rectangle_height // 2) + 15
        y2_rect = (y2 + rectangle_height // 2) + 15

        if track_id is not None:
            cv2.rectangle(
                frame,
                (int(x1_rect), int(y1_rect)),
                (int(x2_rect), int(y2_rect)),
                color,
                cv2.FILLED
            )

            x1_text = x1_rect + 12
            if track_id > 99:
                x1_text -= 10

            cv2.putText(
                frame,
                f"{track_id}",
                (int(x1_text), int(y1_rect + 15)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 0),
                2
            )

        return frame

    def draw_triangle(self, frame, bbox, color):
        y = int(bbox[1])
        x, _ = get_center_of_bbox(bbox)

        triangle_points = np.array([
            [x, y],
            [x - 10, y - 20],
            [x + 10, y - 20]
        ])
        cv2.drawContours(frame, [triangle_points], 0, color, cv2.FILLED)
        cv2.drawContours(frame, [triangle_points], 0, (0, 0, 0), 2)

        return frame

    def draw_team_ball_control(self, frame, frame_num, team_ball_control):
        # Draw a semi-transparent rectangle
        overlay = frame.copy()
        cv2.rectangle(overlay, (1350, 850), (1900, 970), (255, 255, 255), -1)
        alpha = 0.4
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        team_ball_control_till_frame = team_ball_control[:frame_num + 1]
        # Get the number of time each team had ball control
        team_1_num_frames = team_ball_control_till_frame[team_ball_control_till_frame == 1].shape[0]
        team_2_num_frames = team_ball_control_till_frame[team_ball_control_till_frame == 2].shape[0]
        team_1 = team_1_num_frames / (team_1_num_frames + team_2_num_frames)
        team_2 = team_2_num_frames / (team_1_num_frames + team_2_num_frames)

        cv2.putText(frame, f"Team 1 Puck Control: {team_1 * 100:.2f}%", (1400, 900), cv2.FONT_HERSHEY_SIMPLEX, 1,
                    (0, 0, 0), 3)
        cv2.putText(frame, f"Team 2 Puck Control: {team_2 * 100:.2f}%", (1400, 950), cv2.FONT_HERSHEY_SIMPLEX, 1,
                    (0, 0, 0), 3)

        return frame

    def draw_annotations(self, video_frames, tracks, team_puck_control=None):
        output_video_frames = []
        for frame_num, frame in enumerate(video_frames):
            frame = frame.copy()

            player_dict = tracks["players"][frame_num]
            puck_dict = tracks["puck"][frame_num]
            referee_dict = tracks["referees"][frame_num]

            # Draw Players
            for track_id, player in player_dict.items():
                color = player.get("team_color", (0, 0, 255))
                frame = self.draw_ellipse(frame, player["bbox"], color, track_id)

                if player.get('has_puck', False):
                    frame = self.draw_triangle(frame, player["bbox"], (0, 0, 255))

            # Draw Referees
            for _, referee in referee_dict.items():
                frame = self.draw_ellipse(frame, referee["bbox"], (0, 255, 255))  # color in bgr

            # Draw puck
            for track_id, puck in puck_dict.items():
                frame = self.draw_triangle(frame, puck["bbox"], (0, 255, 0))

            if team_puck_control is not None:
                # Draw Team Ball Control
                frame = self.draw_team_ball_control(frame, frame_num, team_puck_control)

            output_video_frames.append(frame)

        return output_video_frames
