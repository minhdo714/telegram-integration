
import sqlite3
import os

DB_PATH = 'users.db'

def check_structure():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    print("=== Table Info: model_assets ===")
    try:
        c.execute("PRAGMA table_info(model_assets)")
        columns = c.fetchall()
        for col in columns:
            print(col)
            
        print("\n=== Data in model_assets ===")
        c.execute("SELECT * FROM model_assets")
        rows = c.fetchall()
        for row in rows:
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_structure()
