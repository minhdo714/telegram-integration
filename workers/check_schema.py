import sqlite3
import os

DB_PATH = 'workers/users.db'

def check():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("--- Database Tables ---")
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in c.fetchall()]
    for t in tables:
        print(f"Table: {t}")
        c.execute(f"PRAGMA table_info({t})")
        cols = [row[1] for row in c.fetchall()]
        print(f"  Columns: {', '.join(cols)}")
    
    conn.close()

if __name__ == "__main__":
    check()
