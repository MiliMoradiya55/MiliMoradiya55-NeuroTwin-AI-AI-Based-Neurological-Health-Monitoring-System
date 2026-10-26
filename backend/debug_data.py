# Backend/debug_data.py

import os
import pandas as pd
import glob

def debug_data():
    print("=" * 60)
    print("🔍 Debugging Data Loading")
    print("=" * 60)
    
    data_path = "data"
    
    # Check if data folder exists
    print(f"\n📁 Checking data folder: {data_path}")
    if not os.path.exists(data_path):
        print("❌ Data folder not found!")
        return
    
    # List contents
    print("\n📂 Contents of data folder:")
    for item in os.listdir(data_path):
        print(f"  - {item}")
    
    # Check users folder
    users_folder = os.path.join(data_path, 'Archived-users', 'Archived users')
    print(f"\n📁 Checking users folder: {users_folder}")
    
    if os.path.exists(users_folder):
        print("✅ Users folder exists!")
        user_files = [f for f in os.listdir(users_folder) if f.endswith('.txt')]
        print(f"📄 Found {len(user_files)} user files")
        
        # Show first 3 user files
        print("\n📄 First 3 user files:")
        for f in user_files[:3]:
            print(f"  - {f}")
            
            # Read first few lines of the file
            try:
                with open(os.path.join(users_folder, f), 'r') as file:
                    lines = file.readlines()[:5]
                    print(f"    Content: {lines}")
            except Exception as e:
                print(f"    Error reading: {e}")
    else:
        print("❌ Users folder not found!")
    
    # Check data folder
    data_folder = os.path.join(data_path, 'Archived-Data', 'Tappy Data')
    print(f"\n📁 Checking data folder: {data_folder}")
    
    if os.path.exists(data_folder):
        print("✅ Data folder exists!")
        files = []
        for root, dirs, filenames in os.walk(data_folder):
            for filename in filenames:
                if filename.endswith('.txt') or filename.endswith('.csv'):
                    files.append(os.path.join(root, filename))
        
        print(f"📄 Found {len(files)} data files")
        
        # Show first 3 data files
        print("\n📄 First 3 data files:")
        for f in files[:3]:
            print(f"  - {os.path.basename(f)}")
            
            # Try to read the file
            try:
                df = pd.read_csv(f)
                print(f"    Shape: {df.shape}")
                print(f"    Columns: {list(df.columns)[:5]}")
                print(f"    First row: {df.iloc[0].to_dict() if len(df) > 0 else 'Empty'}")
            except Exception as e:
                print(f"    Error reading: {e}")
    else:
        print("❌ Data folder not found!")
    
    print("\n" + "=" * 60)
    print("✅ Debug complete!")

if __name__ == "__main__":
    debug_data()