"""
Save emotion labels to JSON file
"""

import os
import json
from utils.config import EMOTIONS, MODELS_PATH

def save_labels():
    """
    Save emotion labels to JSON file
    """
    labels_path = os.path.join(MODELS_PATH, 'labels.json')
    
    labels_dict = {
        'emotions': EMOTIONS,
        'num_classes': len(EMOTIONS),
        'mapping': {i: emotion for i, emotion in enumerate(EMOTIONS)}
    }
    
    with open(labels_path, 'w') as f:
        json.dump(labels_dict, f, indent=4)
    
    print(f"Labels saved to {labels_path}")
    return labels_dict

def load_labels():
    """
    Load emotion labels from JSON file
    """
    labels_path = os.path.join(MODELS_PATH, 'labels.json')
    
    if not os.path.exists(labels_path):
        print(f"Labels file not found at {labels_path}")
        return None
    
    with open(labels_path, 'r') as f:
        labels_dict = json.load(f)
    
    print(f"Labels loaded from {labels_path}")
    return labels_dict

if __name__ == "__main__":
    save_labels()