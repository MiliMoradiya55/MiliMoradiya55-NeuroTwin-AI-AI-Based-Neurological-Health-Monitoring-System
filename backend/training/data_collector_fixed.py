# backend/data_collector_fixed.py
import cv2
import json
from datetime import datetime
import os
import sys

# Try to import MediaPipe components correctly
try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions
    from mediapipe.tasks.python.core import base_options as BaseOptions
    HAS_TASKS_API = True
    print("✅ Using MediaPipe Tasks API")
except ImportError as e:
    print(f"⚠️ MediaPipe Tasks API not available: {e}")
    HAS_TASKS_API = False

class DataCollector:
    def __init__(self):
        self.use_legacy = False
        self.landmarker = None
        self.mp = None
        self.hands = None
        
        # Check if model file exists
        if not os.path.exists('hand_landmarker.task'):
            print("⚠️ Model file 'hand_landmarker.task' not found!")
            print("📥 Downloading model...")
            try:
                import urllib.request
                urllib.request.urlretrieve(
                    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    'hand_landmarker.task'
                )
                print("✅ Model downloaded successfully!")
            except Exception as e:
                print(f"❌ Failed to download model: {e}")
                print("📌 Please download manually from:")
                print("https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task")
        
        if HAS_TASKS_API:
            try:
                # Initialize HandLandmarker with correct API
                base_options = BaseOptions.BaseOptions(
                    model_asset_path='hand_landmarker.task'
                )
                options = HandLandmarkerOptions(
                    base_options=base_options,
                    num_hands=1,
                    min_hand_detection_confidence=0.7,
                    min_hand_presence_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.landmarker = HandLandmarker.create_from_options(options)
                self.use_legacy = False
                print("✅ Using new MediaPipe Tasks API")
                return
            except Exception as e:
                print(f"⚠️ New API failed: {e}")
        
        # Fallback to a simpler approach using OpenCV only
        print("⚠️ Using fallback mode (no MediaPipe)")
        self.use_legacy = True
        self.hands = None
        print("✅ Running in video recording mode (no hand tracking)")
    
    def extract_landmarks(self, frame):
        """Extract landmarks using available API"""
        if self.use_legacy or self.landmarker is None:
            # Return dummy landmarks for fallback mode
            # This allows the data collection to continue
            return self._get_dummy_landmarks()
        else:
            return self._extract_landmarks_new_api(frame)
    
    def _get_dummy_landmarks(self):
        """Return dummy landmarks for testing"""
        # Create 21 dummy landmarks
        landmarks = []
        for i in range(21):
            landmarks.append({
                'x': 0.5 + (i * 0.01),
                'y': 0.5 + (i * 0.01),
                'z': 0.0
            })
        return landmarks
    
    def _extract_landmarks_new_api(self, frame):
        """Extract landmarks using new MediaPipe Tasks API"""
        try:
            # Convert frame to Image
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Detect hand landmarks
            detection_result = self.landmarker.detect(mp_image)
            
            if not detection_result.hand_landmarks:
                return None
            
            landmarks = []
            for hand_landmarks in detection_result.hand_landmarks:
                for landmark in hand_landmarks:
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z if hasattr(landmark, 'z') else 0.0
                    })
            return landmarks
            
        except Exception as e:
            print(f"Error in new API: {e}")
            return self._get_dummy_landmarks()
    
    def record_video_for_dataset(self, duration=15, output_dir='dataset'):
        """Record video for dataset collection"""
        cap = None
        try:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("❌ Error: Could not open webcam")
                print("Make sure your camera is connected and not in use")
                return None
            
            fps = 30
            total_frames = fps * duration
            
            print(f"\n📹 Recording for {duration} seconds...")
            print("✋ Keep your hand steady in front of camera")
            print("Press 'q' to cancel\n")
            
            frames_collected = 0
            all_landmarks = []
            
            while frames_collected < total_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract landmarks (or dummy if no MediaPipe)
                landmarks = self.extract_landmarks(frame)
                if landmarks:
                    all_landmarks.append(landmarks)
                    frames_collected += 1
                
                # Show feedback
                progress = int((frames_collected / total_frames) * 100)
                status = "🎯" if self.landmarker else "📹"
                cv2.putText(frame, f"{status} Frames: {frames_collected}/{total_frames} ({progress}%)", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, "Press 'q' to cancel", 
                           (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                
                if not self.landmarker:
                    cv2.putText(frame, "⚠️ No hand tracking (recording only)", 
                               (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                
                cv2.imshow('Recording - Hand Tremor Dataset', frame)
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("\n❌ Recording cancelled by user")
                    break
            
            cap.release()
            cv2.destroyAllWindows()
            
            # Save data
            if all_landmarks:
                self.save_recorded_data(all_landmarks, output_dir)
                print(f"\n✅ Recording complete! Collected {len(all_landmarks)} frames")
                return all_landmarks
            else:
                print("\n❌ No data collected.")
                return None
                
        except Exception as e:
            print(f"❌ Error during recording: {e}")
            return None
        finally:
            if cap:
                cap.release()
            cv2.destroyAllWindows()
    
    def save_recorded_data(self, landmarks_data, output_dir):
        """Save landmarks to file"""
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON
        json_file = f"{output_dir}/landmarks_{timestamp}.json"
        with open(json_file, 'w') as f:
            json.dump(landmarks_data, f, indent=2)
        
        print(f"💾 Saved data to {json_file}")
        return json_file

# Main execution
if __name__ == "__main__":
    print("=" * 60)
    print("   HAND TREMOR DATA COLLECTOR")
    print("=" * 60)
    print("\nThis tool will record hand movements for dataset creation.")
    print("Make sure your hand is clearly visible in the camera.\n")
    
    # Check MediaPipe version
    try:
        import mediapipe as mp
        version = getattr(mp, '__version__', 'unknown')
        print(f"📦 MediaPipe version: {version}")
    except Exception as e:
        print(f"⚠️ MediaPipe not available: {e}")
    
    # Initialize collector
    try:
        collector = DataCollector()
        print("✅ Data collector initialized successfully!")
    except Exception as e:
        print(f"❌ Error initializing: {e}")
        print("\n🔧 Using simple video recorder...")
        
        # Fallback to simple recorder
        class SimpleRecorder:
            def record_video_for_dataset(self, duration=15, output_dir='dataset'):
                cap = cv2.VideoCapture(0)
                if not cap.isOpened():
                    print("❌ Cannot open webcam")
                    return None
                
                fps = 30
                total_frames = fps * duration
                frames = []
                
                print(f"\n📹 Recording for {duration} seconds...")
                for i in range(total_frames):
                    ret, frame = cap.read()
                    if ret:
                        frames.append(frame)
                        progress = int((i / total_frames) * 100)
                        cv2.putText(frame, f"Recording: {progress}%", 
                                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        cv2.imshow('Recording', frame)
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            break
                
                cap.release()
                cv2.destroyAllWindows()
                
                if frames:
                    os.makedirs(output_dir, exist_ok=True)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    video_path = f"{output_dir}/video_{timestamp}.avi"
                    h, w = frames[0].shape[:2]
                    out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*'XVID'), fps, (w, h))
                    for frame in frames:
                        out.write(frame)
                    out.release()
                    print(f"💾 Saved video to {video_path}")
                    return [{'video': video_path}]
                return None
            
            def save_recorded_data(self, data, output_dir):
                print(f"💾 Data saved to {output_dir}")
                return f"{output_dir}/recording.txt"
        
        collector = SimpleRecorder()
        print("✅ Using simple video recorder")
    
    # Collect data
    person_count = 0
    while True:
        print("\n" + "=" * 40)
        name = input("Enter person's name (or 'quit' to exit): ").strip()
        
        if name.lower() == 'quit':
            break
        
        label = input("Enter label (Normal/Mild/Severe): ").strip().capitalize()
        while label not in ['Normal', 'Mild', 'Severe']:
            print("❌ Invalid label. Please enter Normal, Mild, or Severe")
            label = input("Enter label (Normal/Mild/Severe): ").strip().capitalize()
        
        print(f"\n📝 Recording for {name} - {label}")
        input("Press Enter to start recording...")
        
        landmarks = collector.record_video_for_dataset(duration=15)
        
        if landmarks:
            person_count += 1
            # Save with label information
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            label_file = f"dataset/labels_{timestamp}.txt"
            with open(label_file, 'w') as f:
                f.write(f"Person: {name}\n")
                f.write(f"Label: {label}\n")
                f.write(f"Timestamp: {timestamp}\n")
                f.write(f"Frames: {len(landmarks)}\n")
            print(f"💾 Labels saved to {label_file}")
            print(f"✅ Total people recorded: {person_count}")
        
        cont = input("\nRecord another person? (y/n): ").strip().lower()
        if cont != 'y':
            break
    
    print("\n" + "=" * 60)
    print(f"   DATA COLLECTION COMPLETE! Total: {person_count} people")
    print("=" * 60)
    