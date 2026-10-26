# backend/training/convert_complete.py

import json
import pandas as pd
import os
from glob import glob
import numpy as np
from datetime import datetime

# ===== FIX: Add parent directory to path =====
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from feature_extraction import FeatureExtractor

def convert_complete():
    """Complete conversion pipeline with label handling"""
    
    print("=" * 60)
    print("   📊 COMPLETE DATA CONVERSION")
    print("=" * 60)
    
    # Create dataset directory if not exists
    os.makedirs('dataset', exist_ok=True)
    
    # 1. Check for JSON files
    json_files = glob('dataset/landmarks_*.json')
    
    if not json_files:
        print("❌ No JSON files found in dataset folder!")
        print("\n📌 Options:")
        print("   1. Collect data using: python training/data_collector_fixed.py")
        print("   2. Create synthetic dataset: python create_tremor_dataset.py")
        return None
    
    print(f"\n📂 Found {len(json_files)} JSON files")
    
    # 2. Initialize feature extractor
    feature_extractor = FeatureExtractor()
    
    all_data = []
    label_stats = {'Normal': 0, 'Mild': 0, 'Severe': 0}
    
    for json_file in json_files:
        print(f"\n📄 Processing: {os.path.basename(json_file)}")
        
        try:
            with open(json_file, 'r') as f:
                landmarks = json.load(f)
            
            features = feature_extractor.extract_features_from_landmarks(landmarks)
            
            if not features:
                print(f"   ⚠️ Failed to extract features")
                continue
            
            label = get_label_from_file(json_file)
            features['label'] = label
            all_data.append(features)
            label_stats[label] = label_stats.get(label, 0) + 1
            
            print(f"   ✅ Features extracted, Label: {label}")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    if all_data:
        df = pd.DataFrame(all_data)
        df.to_csv('tremor_dataset.csv', index=False)
        
        print("\n" + "=" * 60)
        print("   ✅ CONVERSION COMPLETE!")
        print("=" * 60)
        print(f"\n📊 Total samples: {len(df)}")
        print(f"\n📊 Label Distribution:")
        for label, count in label_stats.items():
            percentage = (count / len(df)) * 100
            bar = '█' * int(percentage / 2)
            print(f"   {label}: {count} ({percentage:.1f}%) {bar}")
        
        print(f"\n📊 Features: {', '.join(df.columns[:-1])}")
        print(f"\n📊 Dataset saved to: tremor_dataset.csv")
        return df
    else:
        print("\n❌ No data converted!")
        return None

def get_label_from_file(json_file):
    """Extract label from corresponding label file"""
    base_name = os.path.basename(json_file)
    timestamp = base_name.replace('landmarks_', '').replace('.json', '')
    label_file = f'dataset/labels_{timestamp}.txt'
    
    if os.path.exists(label_file):
        with open(label_file, 'r') as f:
            content = f.read()
            for line in content.split('\n'):
                if 'Label:' in line:
                    label = line.split('Label:')[1].strip()
                    if label in ['Normal', 'Mild', 'Severe']:
                        return label
    
    print(f"   ❓ No label found for {base_name}")
    print(f"   Enter label (Normal/Mild/Severe): ")
    label = input().strip().capitalize()
    
    while label not in ['Normal', 'Mild', 'Severe']:
        print("   Invalid label. Enter Normal/Mild/Severe: ")
        label = input().strip().capitalize()
    
    with open(label_file, 'w') as f:
        f.write(f"Label: {label}\n")
        f.write(f"File: {base_name}\n")
    
    return label

if __name__ == "__main__":
    convert_complete()