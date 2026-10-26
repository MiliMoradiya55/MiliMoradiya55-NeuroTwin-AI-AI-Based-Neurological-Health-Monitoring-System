# dataset/check_columns.py
import pandas as pd

def check_dataset():
    """
    Check dataset columns and target column
    """
    df = pd.read_csv('dataset/parkinsons.csv')
    
    print("=" * 80)
    print("📊 DATASET CHECK")
    print("=" * 80)
    
    print(f"\n📁 Shape: {df.shape}")
    print(f"\n📋 All Columns ({len(df.columns)} columns):")
    
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. '{col}'")
    
    print(f"\n🎯 Target column check:")
    
    # Check for potential target columns
    for col in df.columns:
        if 'Unnamed' not in col and col not in ['id', 'gender']:
            unique_count = df[col].nunique()
            if unique_count == 2:
                print(f"   ✅ '{col}' has 2 unique values -> Could be target!")
                print(f"      Values: {df[col].unique()}")
                print(f"      Distribution:\n{df[col].value_counts()}")
    
    # Check last column
    last_col = df.columns[-1]
    print(f"\n   Last column: '{last_col}'")
    if 'Unnamed' not in last_col:
        print(f"   Unique values: {df[last_col].unique()}")
        print(f"   Distribution:\n{df[last_col].value_counts()}")
    
    print("\n🔍 First 5 rows:")
    print(df.head())

if __name__ == "__main__":
    check_dataset()