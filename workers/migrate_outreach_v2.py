import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

def migrate_v2():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check if part3_chatflow exists
    c.execute("PRAGMA table_info(outreach_configs)")
    columns = [col[1] for col in c.fetchall()]
    
    if 'part3_chatflow' not in columns:
        print("Adding part3_chatflow column to outreach_configs...")
        c.execute("ALTER TABLE outreach_configs ADD COLUMN part3_chatflow TEXT")
        conn.commit()
    else:
        print("part3_chatflow column already exists.")

    conn.close()
    print("Migration V2 completed.")

if __name__ == "__main__":
    migrate_v2()
