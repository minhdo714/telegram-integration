import sqlite3
import os

DB_PATH = 'workers/users.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Get existing columns
    c.execute("PRAGMA table_info(telegram_accounts)")
    existing_cols = [row[1] for row in c.fetchall()]
    
    needed_cols = [
        ('telegram_user_id', 'TEXT'),
        ('telegram_username', 'TEXT'),
        ('first_name', 'TEXT'),
        ('last_name', 'TEXT'),
        ('account_ownership', "TEXT DEFAULT 'user_owned'"),
        ('session_status', "TEXT DEFAULT 'active'"),
        ('proxy_url', 'TEXT'),
        ('active_config_id', 'INTEGER')
    ]
    
    print("--- Checking Columns ---")
    for col_name, col_type in needed_cols:
        if col_name not in existing_cols:
            print(f"Adding column: {col_name}")
            try:
                c.execute(f"ALTER TABLE telegram_accounts ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column already exists: {col_name}")
            
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
