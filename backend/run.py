# backend/run.py

"""
Runner script for voice model training
"""

import sys
import os

# ===== FIX: Add current directory to Python path =====
# This MUST be the FIRST thing
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print("=" * 60)
print("🔊 VOICE MODEL TRAINING RUNNER")
print("=" * 60)
print(f"📁 Backend directory: {backend_dir}")
print(f"📁 Python path: {sys.path[:3]}")
print("=" * 60)

# ===== NOW IMPORT WORKS =====
try:
    from training.train_voice import main
    print("✅ Imports successful!")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("🔧 Try running with: python -m training.train_voice")
    sys.exit(1)

if __name__ == "__main__":
    main()