
import sqlite3
import os

DB_PATH = 'users.db'

def migrate_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Migrating Database...")

    # 1. Create ai_config_presets table
    try:
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_config_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            system_prompt TEXT,
            model_provider TEXT,
            model_name TEXT,
            temperature REAL DEFAULT 0.7,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        print("Created table: ai_config_presets")
    except Exception as e:
        print(f"Error creating table: {e}")

    # 2. Add columns to telegram_accounts
    # active_config_id
    try:
        cursor.execute("ALTER TABLE telegram_accounts ADD COLUMN active_config_id INTEGER REFERENCES ai_config_presets(id)")
        print("Added column: active_config_id")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column active_config_id already exists")
        else:
            print(f"Error adding active_config_id: {e}")

    # proxy_url
    try:
        cursor.execute("ALTER TABLE telegram_accounts ADD COLUMN proxy_url TEXT")
        print("Added column: proxy_url")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column proxy_url already exists")
        else:
            print(f"Error adding proxy_url: {e}")

    conn.commit()
    conn.close()
    print("Migration Complete.")

if __name__ == "__main__":
    migrate_db()
