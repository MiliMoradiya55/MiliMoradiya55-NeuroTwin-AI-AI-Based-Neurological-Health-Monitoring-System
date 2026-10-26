# Backend/train_typing_model.py

import os
import sys
import json
import numpy as np
import pandas as pd
import glob
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras import layers, models
import joblib

# ===== FEATURE EXTRACTOR =====
class TypingFeatureExtractor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_columns = [
            'hold_time_mean', 'hold_time_std', 'hold_time_min', 'hold_time_max',
            'latency_mean', 'latency_std', 'latency_min', 'latency_max',
            'flight_time_mean', 'flight_time_std', 'flight_time_min', 'flight_time_max',
            'typing_speed', 'key_press_variance', 'rhythm_variance',
            'backspace_frequency', 'error_rate', 'consistency_score'
        ]

    def extract_features_from_typing_data(self, keystrokes):
        if not keystrokes:
            return None
        try:
            df = pd.DataFrame(keystrokes)
            
            # Ensure columns exist
            for col in ['hold_time', 'latency', 'flight_time']:
                if col not in df.columns:
                    df[col] = 0
            
            hold_stats = self._get_stats(df, 'hold_time')
            latency_stats = self._get_stats(df, 'latency')
            flight_stats = self._get_stats(df, 'flight_time')
            
            total_time = sum(df['latency']) if 'latency' in df else 0
            typing_speed = len(df) / (total_time / 60000) if total_time > 0 else 0
            
            key_press_variance = np.var(df['latency']) if 'latency' in df else 0
            
            if 'latency' in df and len(df) > 1:
                rhythm_variance = np.var(np.diff(df['latency']))
            else:
                rhythm_variance = 0
            
            backspace_count = len(df[df['direction'] == 'S']) if 'direction' in df else 0
            backspace_frequency = backspace_count / len(df) if len(df) > 0 else 0
            error_rate = backspace_frequency
            consistency_score = 100 - (key_press_variance / 10) if key_press_variance > 0 else 100
            
            return {
                'hold_time_mean': hold_stats['mean'],
                'hold_time_std': hold_stats['std'],
                'hold_time_min': hold_stats['min'],
                'hold_time_max': hold_stats['max'],
                'latency_mean': latency_stats['mean'],
                'latency_std': latency_stats['std'],
                'latency_min': latency_stats['min'],
                'latency_max': latency_stats['max'],
                'flight_time_mean': flight_stats['mean'],
                'flight_time_std': flight_stats['std'],
                'flight_time_min': flight_stats['min'],
                'flight_time_max': flight_stats['max'],
                'typing_speed': typing_speed,
                'key_press_variance': key_press_variance,
                'rhythm_variance': rhythm_variance,
                'backspace_frequency': backspace_frequency,
                'error_rate': error_rate,
                'consistency_score': min(100, max(0, consistency_score))
            }
        except Exception as e:
            return None

    def _get_stats(self, df, column):
        if column in df and len(df) > 0:
            data = df[column].dropna()
            if len(data) > 0:
                return {
                    'mean': np.mean(data),
                    'std': np.std(data),
                    'min': np.min(data),
                    'max': np.max(data)
                }
        return {'mean': 0, 'std': 0, 'min': 0, 'max': 0}


# ===== LSTM MODEL =====
def build_lstm_model(input_shape):
    model = models.Sequential([
        layers.LSTM(64, return_sequences=True, input_shape=input_shape),
        layers.Dropout(0.2),
        layers.LSTM(32, return_sequences=False),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model


# ===== PARSE KEYSTROKE FILE =====
def parse_keystroke_file(file_path):
    """Parse the tab-separated keystroke file"""
    try:
        # Read the file
        with open(file_path, 'r') as f:
            lines = f.readlines()
        
        keystrokes = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Split by tab
            parts = line.split('\t')
            
            # The data format: UserKey, Date, Time, Hand, HoldTime, Direction, Latency, FlightTime
            # Example: 0EA27ICBLF	160722	18:41:04.336	L	0101.6	LL	0234.4	0156.3
            if len(parts) >= 8:
                try:
                    # Extract data
                    hand = parts[3]  # L or R
                    hold_time = float(parts[4]) if parts[4] else 0
                    direction = parts[5]  # LL, RR, RL, LR
                    latency = float(parts[6]) if parts[6] else 0
                    flight_time = float(parts[7]) if parts[7] else 0
                    
                    keystrokes.append({
                        'hand': hand,
                        'hold_time': hold_time,
                        'direction': direction,
                        'latency': latency,
                        'flight_time': flight_time
                    })
                except (ValueError, IndexError) as e:
                    continue
        
        return keystrokes
        
    except Exception as e:
        return []


# ===== DATA LOADER =====
def load_tappy_data(data_path):
    all_data = []
    labels = []
    
    # ===== LOAD USER INFO =====
    users_folder = os.path.join(data_path, 'Archived-users', 'Archived users')
    
    if not os.path.exists(users_folder):
        print(f"❌ Users folder not found: {users_folder}")
        return [], []
    
    print(f"✅ Found users folder: {users_folder}")
    
    # Parse user files
    user_info = {}
    user_files = [f for f in os.listdir(users_folder) if f.startswith('User_') and f.endswith('.txt')]
    
    print(f"✅ Found {len(user_files)} user files")
    
    for user_file in user_files:
        try:
            with open(os.path.join(users_folder, user_file), 'r') as f:
                content = f.read()
            
            user_code = user_file.replace('User_', '').replace('.txt', '')
            
            # Parse user info
            parkinsons = False
            age = None
            
            for line in content.split('\n'):
                line = line.strip()
                if 'Parkinsons:' in line:
                    val = line.split(':')[1].strip().lower()
                    parkinsons = val in ['true', 'yes', '1', 't', 'y']
                elif 'BirthYear:' in line:
                    try:
                        birth_year = int(line.split(':')[1].strip())
                        age = 2026 - birth_year
                    except:
                        pass
            
            user_info[user_code] = {
                'parkinsons': parkinsons,
                'age': age
            }
            
        except Exception as e:
            print(f"Error parsing {user_file}: {e}")
    
    print(f"✅ Loaded {len(user_info)} users with Parkinson's status")
    
    # ===== FIND DATA FOLDER =====
    data_folder = os.path.join(data_path, 'Archived-Data', 'Tappy Data')
    
    if not os.path.exists(data_folder):
        print(f"❌ Data folder not found: {data_folder}")
        return [], []
    
    print(f"✅ Found data folder: {data_folder}")
    
    # ===== GET ALL TEXT FILES =====
    files = []
    for root, dirs, filenames in os.walk(data_folder):
        for filename in filenames:
            if filename.endswith('.txt'):
                files.append(os.path.join(root, filename))
    
    print(f"✅ Found {len(files)} keystroke files")
    
    if len(files) == 0:
        print("⚠️ No .txt files found")
        return [], []
    
    # Show first few files
    print(f"\n📄 First 5 files:")
    for f in files[:5]:
        print(f"  - {os.path.basename(f)}")
    
    extractor = TypingFeatureExtractor()
    processed = 0
    matched = 0
    unmatched = 0
    errors = 0
    
    print(f"\n📊 Processing {len(files)} files...")
    print("=" * 60)
    
    # ===== PROCESS EACH FILE =====
    for idx, file_path in enumerate(files):
        # Show progress
        if idx % 50 == 0:
            print(f"  Progress: {idx}/{len(files)} files")
        
        try:
            filename = os.path.basename(file_path)
            user_code = filename.split('_')[0]
            
            # Check if we have info for this user
            if user_code not in user_info:
                unmatched += 1
                continue
            
            matched += 1
            has_parkinsons = user_info[user_code]['parkinsons']
            
            # Parse the keystroke file
            keystrokes = parse_keystroke_file(file_path)
            
            if len(keystrokes) < 10:
                errors += 1
                continue
            
            # Extract features
            features = extractor.extract_features_from_typing_data(keystrokes)
            
            if features:
                all_data.append(features)
                labels.append(1 if has_parkinsons else 0)
                processed += 1
                    
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  ⚠️ Error: {os.path.basename(file_path)} - {str(e)[:50]}")
            continue
    
    print("\n" + "=" * 60)
    print(f"\n📊 Processing Complete!")
    print(f"  Total files: {len(files)}")
    print(f"  Successfully processed: {processed}")
    print(f"  Matched users: {matched}")
    print(f"  Unmatched users: {unmatched}")
    print(f"  Errors: {errors}")
    print(f"  Positive samples (Parkinson's): {sum(labels)}")
    print(f"  Negative samples (Healthy): {len(labels) - sum(labels)}")
    
    return all_data, labels


# ===== TRAIN =====
def train_model():
    print("=" * 60)
    print("NeuroTwin AI - LSTM Typing Pattern Model Training")
    print("=" * 60)
    
    data_path = "data"
    if not os.path.exists(data_path):
        data_path = "../data"
    
    if not os.path.exists(data_path):
        print(f"❌ Data folder not found")
        return False
    
    os.makedirs("models", exist_ok=True)
    
    try:
        # Load data
        print("\n📊 Loading data...")
        features_list, labels = load_tappy_data(data_path)
        
        if not features_list:
            print("❌ No data loaded!")
            return False
        
        print(f"\n📊 Dataset Summary:")
        print(f"  Total samples: {len(features_list)}")
        print(f"  Positive (Parkinson's): {sum(labels)}")
        print(f"  Negative (Healthy): {len(labels) - sum(labels)}")
        
        # Normalize
        print("\n📊 Normalizing features...")
        extractor = TypingFeatureExtractor()
        feature_df = pd.DataFrame(features_list)
        scaler = StandardScaler()
        normalized = scaler.fit_transform(feature_df)
        
        # Save scaler
        joblib.dump(scaler, 'models/scaler.pkl')
        print("✅ Scaler saved to: models/scaler.pkl")
        
        # Prepare sequences for LSTM
        sequence_length = 10
        X, y = [], []
        for i in range(len(normalized) - sequence_length + 1):
            X.append(normalized[i:i+sequence_length])
            y.append(labels[i + sequence_length - 1])
        
        X = np.array(X)
        y = np.array(y)
        print(f"✅ Created {len(X)} sequences")
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.25, random_state=42)
        print(f"\n📊 Data Split:")
        print(f"  Train: {len(X_train)}")
        print(f"  Validation: {len(X_val)}")
        print(f"  Test: {len(X_test)}")
        
        # Build model
        print("\n📊 Building LSTM model...")
        input_shape = (sequence_length, normalized.shape[1])
        model = build_lstm_model(input_shape)
        model.summary()
        
        # Train
        print("\n📊 Training LSTM model...")
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=20,
            batch_size=32,
            verbose=1
        )
        
        # Evaluate
        print("\n📊 Evaluating model...")
        test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
        print(f"\n✅ Test Accuracy: {test_acc:.4f}")
        print(f"✅ Test Loss: {test_loss:.4f}")
        
        # Save
        model.save('models/typing_lstm.h5')
        print("\n✅ Model saved to: models/typing_lstm.h5")
        
        print("\n" + "=" * 60)
        print("✅ TRAINING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    train_model()