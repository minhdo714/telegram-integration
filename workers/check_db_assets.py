import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')

if not os.path.exists(DB_PATH):
    print(f"DB not found at {DB_PATH}")
    exit(1)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("=== model_assets columns ===")
try:
    c.execute("PRAGMA table_info(model_assets)")
    cols = c.fetchall()
    for col in cols:
        print(col)
except Exception as e:
    print(e)

print("\n=== ai_config_presets columns ===")
try:
    c.execute("PRAGMA table_info(ai_config_presets)")
    cols = c.fetchall()
    for col in cols:
        print(col)
except Exception as e:
    print(e)

conn.close()
