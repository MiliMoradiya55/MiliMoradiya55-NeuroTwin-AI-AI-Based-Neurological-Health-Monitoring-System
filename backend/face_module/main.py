"""
Main entry point for Face Emotion Module
"""

import os
import sys
import argparse
from datetime import datetime

from utils.config import OUTPUTS_PATH, MODELS_PATH
from training.train import train_model
from training.evaluate import evaluate_model
from training.save_labels import save_labels
from inference.predict_image import predict_single_image
from inference.predict_webcam import run_webcam_emotion
from inference.realtime_face import main as realtime_face_main
from api.face_api import run_api

directories = [
    'dataset/train/angry',
    'dataset/train/disgust',
    'dataset/train/fear',
    'dataset/train/happy',
    'dataset/train/neutral',
    'dataset/train/sad',
    'dataset/train/surprise',
    'dataset/test/angry',
    'dataset/test/disgust',
    'dataset/test/fear',
    'dataset/test/happy',
    'dataset/test/neutral',
    'dataset/test/sad',
    'dataset/test/surprise',
    'models',
    'outputs/predictions',
    'outputs/reports',
    'outputs/graphs',
    'outputs/logs'
]

for directory in directories:
    os.makedirs(directory, exist_ok=True)
    print(f"Created: {directory}")

def print_banner():
    """Print banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🧠 NeuroTwin AI - Face Emotion Module                     ║
    ║   Personalized Digital Brain Twin for Neurological Health   ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Face Emotion Module for NeuroTwin AI')
    parser.add_argument('--mode', type=str, default='webcam',
                       choices=['train', 'evaluate', 'webcam', 'realtime', 
                               'image', 'api', 'save_labels'],
                       help='Mode to run')
    parser.add_argument('--image_path', type=str, help='Path to image for prediction')
    parser.add_argument('--model_path', type=str, help='Path to model file')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='API host')
    parser.add_argument('--port', type=int, default=5000, help='API port')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    print_banner()
    print(f"Mode: {args.mode}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    if args.mode == 'train':
        print("Starting training...")
        train_model()
        
    elif args.mode == 'evaluate':
        print("Starting evaluation...")
        evaluate_model()
        
    elif args.mode == 'webcam':
        print("Starting webcam emotion detection...")
        run_webcam_emotion()
        
    elif args.mode == 'realtime':
        print("Starting real-time face analysis...")
        realtime_face_main()
        
    elif args.mode == 'image':
        if not args.image_path:
            print("Error: --image_path required for image mode")
            sys.exit(1)
        print(f"Predicting emotion from image: {args.image_path}")
        predict_single_image(args.image_path)
        
    elif args.mode == 'api':
        print(f"Starting API server on {args.host}:{args.port}")
        run_api(host=args.host, port=args.port, debug=args.debug)
        
    elif args.mode == 'save_labels':
        print("Saving labels...")
        save_labels()
        
    else:
        print(f"Unknown mode: {args.mode}")
        parser.print_help()

if __name__ == '__main__':
    main()