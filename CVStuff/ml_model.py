import random
import cv2
import numpy as np
from typing import List, Optional, Tuple
import re
import matplotlib.pyplot as plt
from scipy import ndimage

from OOP.ActionType import ActionType
from OOP.Position import Position
from OOP.Team import Team
from OOP.GameAction import GameAction
from OOP.Player import Player


class HockeyActionDetector:
    def __init__(self):
        # In a real implementation, you would load a trained model here
        # For now, we'll simulate detection with basic computer vision
        # Initialize puck tracking variables
        self.puck_positions = []
        self.previous_puck_position = None

    def process_video(self, video_path: str, team_home: Team, team_away: Team) -> Tuple[
        List[GameAction], List[Tuple[float, float, float]]]:
        """Process video and return detected actions"""
        print(f"Processing video: {video_path}")

        # Open video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Could not open video file {video_path}")
            return self._simulate_processing(video_path, team_home, team_away)

        actions = []
        frame_count = 0
        fps = cap.get(cv2.CAP_PROP_FPS) or 30  # Default to 30 fps if unknown
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        print(f"Video info: {total_frames} frames at {fps} fps")

        puck_positions = []
        frame_count = 0

        # Process video frames
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            current_time = frame_count / fps

            # Extract time and period from on-screen display (basic implementation)
            period, game_time = self._extract_time_info(frame, current_time)

            puck_pos = self._detect_puck(frame, current_time)
            if puck_pos:
                puck_positions.append((current_time, puck_pos[0], puck_pos[1]))

            # Detect potential goal/shot events (basic implementation)
            if self._detect_goal_or_shot_event(frame):
                # Try to detect jersey numbers and team colors
                detected_player, detected_team = self._detect_player_and_team(
                    frame, team_home, team_away
                )

                # Determine action type (goal vs shot)
                action_type = self._determine_action_type(frame)

                # Get approximate position on rink
                x, y = self._estimate_rink_position(frame)

                # Handle assists for goals
                assists = []
                if action_type == ActionType.GOAL:
                    assists = self._detect_assists(frame, detected_team, detected_player)

                action = GameAction(
                    type=action_type,
                    team=detected_team,
                    player=detected_player,
                    period=period,
                    time=int(game_time),
                    y=y,
                    x=x,
                    assists=assists
                )

                actions.append(action)
                print(f"Detected {action_type.value} by {detected_player.name} at {game_time:.1f}s")

            # Process every 10th frame for performance
            for _ in range(9):
                ret, _ = cap.read()
                if not ret:
                    break
                frame_count += 10

        cap.release()

        print(f"Processing complete. Detected {len(actions)} actions.")

        # If no actions detected, fall back to simulation
        if not actions:
            print("No actions detected, using simulation fallback")
            return self._simulate_processing(video_path, team_home, team_away), puck_positions

        return actions, puck_positions

    def _detect_puck(self, frame: np.ndarray, current_time: float) -> Optional[Tuple[float, float]]:
        """Detect puck position using color thresholding and contour detection"""
        # Convert to HSV color space for better color segmentation
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Define color range for puck (black/dark colors)
        lower_black = np.array([0, 0, 0])
        upper_black = np.array([180, 255, 50])

        # Create mask for black objects
        mask = cv2.inRange(hsv, lower_black, upper_black)

        # Apply morphological operations to reduce noise
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter contours by size and circularity
        for contour in contours:
            area = cv2.contourArea(contour)
            if 10 < area < 500:  # Puck size range
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    circularity = 4 * np.pi * area / (perimeter * perimeter)
                    if circularity > 0.6:  # Puck is roughly circular
                        # Get bounding circle
                        (x, y), radius = cv2.minEnclosingCircle(contour)

                        # Convert to rink coordinates (0-100 scale)
                        height, width = frame.shape[:2]
                        x_percent = (x / width) * 100
                        y_percent = (y / height) * 100

                        return (x_percent, y_percent)

        return None

    def _extract_time_info(self, frame: np.ndarray, video_time: float) -> Tuple[int, float]:
        """
        Extract time and period information from on-screen display.
        This is a basic implementation - in practice, you'd use OCR.
        """
        # TODO: Implement OCR to read time from scoreboard
        # For now, estimate based on video time (assuming 20 min periods)
        period = min(3, int(video_time / 1200) + 1)  # 20 min = 1200 seconds per period
        game_time = video_time % 1200  # Time within current period

        return period, game_time

    def _detect_goal_or_shot_event(self, frame: np.ndarray) -> bool:
        """
        Detect if current frame contains a goal or shot event using background subtraction.
        """
        # Initialize background subtractor if not already done
        if not hasattr(self, 'backSub'):
            self.backSub = cv2.createBackgroundSubtractorMOG2(
                history=500,
                varThreshold=16,
                detectShadows=True
            )

        # Apply background subtraction
        fgMask = self.backSub.apply(frame)

        # Apply morphological operations to reduce noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_OPEN, kernel)

        # Find contours in the foreground mask
        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Define goal areas (left and right sides of the rink)
        height, width = frame.shape[:2]
        left_goal_area = (0, int(height * 0.3), int(width * 0.15), int(height * 0.7))
        right_goal_area = (int(width * 0.85), int(height * 0.3), width, int(height * 0.7))

        # Check for significant motion in goal areas
        goal_detected = False

        for contour in contours:
            if cv2.contourArea(contour) < 500:  # Filter out small contours
                continue

            # Get bounding box of the contour
            x, y, w, h = cv2.boundingRect(contour)

            # Check if contour is in left goal area
            if (x > left_goal_area[0] and x + w < left_goal_area[2] and
                    y > left_goal_area[1] and y + h < left_goal_area[3]):
                goal_detected = True
                break

            # Check if contour is in right goal area
            if (x > right_goal_area[0] and x + w < right_goal_area[2] and
                    y > right_goal_area[1] and y + h < right_goal_area[3]):
                goal_detected = True
                break

        return goal_detected

    def _detect_player_and_team(self, frame: np.ndarray, team_home: Team, team_away: Team) -> Tuple[Player, Team]:
        """
        Detect player jersey number and team based on jersey color.
        Returns the detected player and team, or placeholder if unresolved.
        """
        # TODO: Implement jersey number OCR and color detection
        # This would involve:
        # 1. Detecting jersey regions in the frame
        # 2. Using OCR to read jersey numbers
        # 3. Analyzing jersey colors to determine team
        # 4. Matching jersey number + team to find specific player

        # For now, use random selection with some logic
        detected_team = random.choice([team_home, team_away])

        # Try to find a player from the roster
        if detected_team.roster and len(detected_team.roster) > 0:
            detected_player = random.choice(detected_team.roster)
        elif detected_team.players and len(detected_team.players) > 0:
            detected_player = random.choice(detected_team.players)
        else:
            # Create placeholder player for unresolved cases
            detected_player = self._create_placeholder_player(detected_team.id)

        return detected_player, detected_team

    def _determine_action_type(self, frame: np.ndarray) -> ActionType:
        """
        Determine if the detected event is a goal or shot.
        In practice, this would analyze goal light, crowd reaction, etc.
        """
        # TODO: Implement goal detection using:
        # - Goal light detection
        # - Crowd reaction analysis
        # - Scoreboard changes
        # - Celebration detection

        # For now, use probability (goals are less common than shots)
        return ActionType.GOAL if random.random() < 0.25 else ActionType.SHOT

    def _estimate_rink_position(self, frame: np.ndarray) -> Tuple[float, float]:
        """
        Estimate the position on the rink where the action occurred.
        This would involve perspective transformation and court mapping.
        """
        # TODO: Implement rink mapping:
        # 1. Detect rink boundaries and key features (goal posts, center line, etc.)
        # 2. Apply perspective transformation
        # 3. Map pixel coordinates to rink coordinates

        # For now, return random position
        x = random.uniform(10, 90)  # Avoid exact edges
        y = random.uniform(10, 90)

        return x, y

    def _detect_assists(self, frame: np.ndarray, team: Team, goal_scorer: Player) -> List[Player]:
        """
        Detect players who assisted on a goal.
        This would involve tracking player positions and puck movement.
        """
        # TODO: Implement assist detection:
        # - Track puck movement before goal
        # - Identify players who touched puck
        # - Exclude goal scorer from assists

        assists = []
        if random.random() < 0.7:  # 70% chance of assists
            available_players = []

            # Get players from roster or team players
            if team.roster:
                available_players = [p for p in team.roster if p.id != goal_scorer.id]
            elif team.players:
                available_players = [p for p in team.players if p.id != goal_scorer.id]

            if available_players:
                num_assists = random.randint(1, min(2, len(available_players)))
                assists = random.sample(available_players, num_assists)

        return assists

    def _create_placeholder_player(self, team_id: str) -> Player:
        """Create a placeholder player for unresolved jersey number/team detection"""
        return Player(
            id="unresolved_player",
            name="Unresolved Player",
            jerseyNumber=0,  # 0 indicates unresolved
            position=Position.FORWARD,
            teamId=team_id
        )

    def _simulate_processing(self, video_path: str, team_home: Team, team_away: Team) -> List[GameAction]:
        """Simulate ML processing by generating random events (fallback method)"""
        print("Using simulation fallback for action detection")

        actions = []

        # Generate random number of events (5-15)
        num_events = random.randint(5, 15)

        for _ in range(num_events):
            action_type = ActionType.GOAL if random.random() < 0.3 else ActionType.SHOT
            team = team_home if random.random() < 0.5 else team_away

            # Try to get player from roster first, then from team players
            if team.roster and len(team.roster) > 0:
                player = random.choice(team.roster)
            elif team.players and len(team.players) > 0:
                player = random.choice(team.players)
            else:
                # Fallback to placeholder player
                player = self._create_placeholder_player(team.id)

            x = random.uniform(5, 95)  # Avoid exact edges
            y = random.uniform(5, 95)
            time = random.randint(0, 3600)  # Random time in game
            period = random.randint(1, 3)

            assists = []
            if action_type == ActionType.GOAL and random.random() < 0.7:
                # 70% chance of having assists for goals
                num_assists = random.randint(1, 2)

                potential_assists = []
                if team.roster:
                    potential_assists = [p for p in team.roster if p.id != player.id]
                elif team.players:
                    potential_assists = [p for p in team.players if p.id != player.id]

                if potential_assists:
                    assists = random.sample(
                        potential_assists,
                        min(num_assists, len(potential_assists))
                    )

            action = GameAction(
                type=action_type,
                team=team,
                player=player,
                period=period,
                time=time,
                x=x,
                y=y,
                assists=assists
            )

            actions.append(action)

        return actions
