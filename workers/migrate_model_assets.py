
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

def migrate():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    columns_to_add = [
        ("system_prompt", "TEXT"),
        ("model_name", "TEXT"),
        ("model_provider", "TEXT"),
        ("temperature", "REAL")
    ]

    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name} to model_assets...")
            c.execute(f"ALTER TABLE model_assets ADD COLUMN {col_name} {col_type}")
            print(f"[OK] Added {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"[SKIP] Column {col_name} already exists")
            else:
                print(f"[FAIL] Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
