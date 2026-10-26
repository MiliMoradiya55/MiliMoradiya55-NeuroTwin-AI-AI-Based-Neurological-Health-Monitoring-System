# backend/migrate_typing_add_columns.py

"""
Safe migration: add new columns to typing_assessments without losing data.
Existing rows will have NULL for new columns (fine — will be filled on next assessment).
"""

import sqlite3
import os

DB_PATH = "neurotwin.db"

# Columns to add: (column_name, sqlite_type)
NEW_COLUMNS = [
    # Hold times
    ("hold_time_mean", "REAL"),
    ("hold_time_std", "REAL"),
    ("hold_time_min", "REAL"),
    ("hold_time_max", "REAL"),
    # Latency
    ("latency_mean", "REAL"),
    ("latency_std", "REAL"),
    ("latency_min", "REAL"),
    ("latency_max", "REAL"),
    # Flight time
    ("flight_time_mean", "REAL"),
    ("flight_time_std", "REAL"),
    ("flight_time_min", "REAL"),
    ("flight_time_max", "REAL"),
    # Variance
    ("key_press_variance", "REAL"),
    ("rhythm_variance", "REAL"),
    ("backspace_frequency", "REAL"),
    ("consistency_score", "REAL"),
]


def migrate():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(typing_assessments)")
    existing = {row[1] for row in cursor.fetchall()}
    print(f"📊 Existing columns: {len(existing)}")

    # Add missing ones
    added = 0
    for col_name, col_type in NEW_COLUMNS:
        if col_name in existing:
            print(f"⏭️  Already exists: {col_name}")
            continue

        try:
            sql = f"ALTER TABLE typing_assessments ADD COLUMN {col_name} {col_type}"
            cursor.execute(sql)
            print(f"✅ Added: {col_name} ({col_type})")
            added += 1
        except Exception as e:
            print(f"❌ Failed to add {col_name}: {e}")

    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"✅ Migration complete. Added {added} new columns.")
    print(f"{'='*60}")


if __name__ == "__main__":
    migrate()