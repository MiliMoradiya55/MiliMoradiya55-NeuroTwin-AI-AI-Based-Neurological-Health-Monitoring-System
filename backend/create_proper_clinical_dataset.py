# backend/create_proper_clinical_dataset.py
import pandas as pd
import numpy as np

def create_proper_clinical_dataset():
    """Create dataset where tremor features are the PRIMARY indicators"""
    
    np.random.seed(42)
    
    n_samples = 100  # 100 per class
    
    data = {
        'tremor_frequency': [],
        'tremor_amplitude': [],
        'hand_stability': [],
        'jerk': [],
        'variance': [],
        'range_movement': [],
        'wrist_stability': [],
        'wrist_movement': [],
        'label': []
    }
    
    # ============================================
    # NORMAL: Low tremor, High stability
    # ============================================
    for _ in range(n_samples):
        # PRIMARY TREMOR FEATURES (These should drive the prediction)
        freq = np.random.uniform(1.0, 3.0)      # 1-3 Hz
        amp = np.random.uniform(0.3, 1.2)       # 0.3-1.2 mm
        stab = np.random.uniform(88, 99)        # 88-99%
        
        # SECONDARY FEATURES (Derived from primary features)
        # Jerk = rate of change of acceleration (correlated with amplitude)
        jerk = amp * np.random.uniform(0.02, 0.04)
        
        # Variance = how much position varies (correlated with amplitude)
        variance = (amp / 10) * np.random.uniform(0.8, 1.2)
        
        # Range of movement = max - min position (correlated with amplitude)
        range_mov = amp * np.random.uniform(0.9, 1.1)
        
        # Wrist stability = similar to hand stability
        wrist_stab = stab * np.random.uniform(0.95, 1.05)
        wrist_stab = min(99, max(85, wrist_stab))
        
        # Wrist movement = correlated with amplitude
        wrist_move = amp * np.random.uniform(0.3, 0.7)
        
        # Store
        data['tremor_frequency'].append(freq)
        data['tremor_amplitude'].append(amp)
        data['hand_stability'].append(stab)
        data['jerk'].append(jerk)
        data['variance'].append(variance)
        data['range_movement'].append(range_mov)
        data['wrist_stability'].append(wrist_stab)
        data['wrist_movement'].append(wrist_move)
        data['label'].append('Normal')
    
    # ============================================
    # MILD: Medium tremor, Medium stability
    # ============================================
    for _ in range(n_samples):
        # PRIMARY TREMOR FEATURES
        freq = np.random.uniform(3.0, 5.0)      # 3-5 Hz
        amp = np.random.uniform(1.5, 3.5)       # 1.5-3.5 mm
        stab = np.random.uniform(65, 87)        # 65-87%
        
        # SECONDARY FEATURES (Derived from primary)
        jerk = amp * np.random.uniform(0.03, 0.06)
        variance = (amp / 10) * np.random.uniform(0.8, 1.2)
        range_mov = amp * np.random.uniform(0.9, 1.1)
        
        wrist_stab = stab * np.random.uniform(0.95, 1.05)
        wrist_stab = min(99, max(60, wrist_stab))
        wrist_move = amp * np.random.uniform(0.4, 0.8)
        
        data['tremor_frequency'].append(freq)
        data['tremor_amplitude'].append(amp)
        data['hand_stability'].append(stab)
        data['jerk'].append(jerk)
        data['variance'].append(variance)
        data['range_movement'].append(range_mov)
        data['wrist_stability'].append(wrist_stab)
        data['wrist_movement'].append(wrist_move)
        data['label'].append('Mild')
    
    # ============================================
    # SEVERE: High tremor, Low stability
    # ============================================
    for _ in range(n_samples):
        # PRIMARY TREMOR FEATURES
        freq = np.random.uniform(5.0, 8.0)      # 5-8 Hz
        amp = np.random.uniform(3.5, 6.5)       # 3.5-6.5 mm
        stab = np.random.uniform(35, 64)        # 35-64%
        
        # SECONDARY FEATURES (Derived from primary)
        jerk = amp * np.random.uniform(0.04, 0.08)
        variance = (amp / 10) * np.random.uniform(0.8, 1.2)
        range_mov = amp * np.random.uniform(0.9, 1.1)
        
        wrist_stab = stab * np.random.uniform(0.95, 1.05)
        wrist_stab = min(99, max(30, wrist_stab))
        wrist_move = amp * np.random.uniform(0.5, 0.9)
        
        data['tremor_frequency'].append(freq)
        data['tremor_amplitude'].append(amp)
        data['hand_stability'].append(stab)
        data['jerk'].append(jerk)
        data['variance'].append(variance)
        data['range_movement'].append(range_mov)
        data['wrist_stability'].append(wrist_stab)
        data['wrist_movement'].append(wrist_move)
        data['label'].append('Severe')
    
    # Create DataFrame and shuffle
    df = pd.DataFrame(data)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    df.to_csv('tremor_dataset.csv', index=False)
    
    print("=" * 60)
    print("   ✅ PROPER CLINICAL DATASET CREATED")
    print("=" * 60)
    print(f"\n📊 Total samples: {len(df)}")
    print(f"\n📊 Label Distribution:")
    print(df['label'].value_counts())
    
    print(f"\n📊 Feature Statistics (Should show clear separation):")
    print("\nNormal:")
    print(df[df['label']=='Normal'][['tremor_frequency', 'tremor_amplitude', 'hand_stability']].describe())
    print("\nMild:")
    print(df[df['label']=='Mild'][['tremor_frequency', 'tremor_amplitude', 'hand_stability']].describe())
    print("\nSevere:")
    print(df[df['label']=='Severe'][['tremor_frequency', 'tremor_amplitude', 'hand_stability']].describe())
    
    print(f"\n✅ Saved to: tremor_dataset.csv")
    return df

if __name__ == "__main__":
    create_proper_clinical_dataset()