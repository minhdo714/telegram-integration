import sqlite3
import os

DB_PATH = 'users.db'

def update_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found. Please initialize it first.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    print("Dropping model_assets table to update schema...")
    c.execute('DROP TABLE IF EXISTS model_assets')

    print("Creating model_assets table...")
    c.execute('''
        CREATE TABLE IF NOT EXISTS model_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_id INTEGER,
            opener_images TEXT,  -- JSON list of paths
            followup_image_path TEXT,
            script_template TEXT,
            model_face_ref TEXT,
            model_body_ref TEXT,
            room_bg_ref TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    print("Creating chat_sessions table...")
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            remote_user_id INTEGER NOT NULL,
            username TEXT,
            state TEXT DEFAULT 'OPENER_SENT',
            extracted_preferences TEXT,
            last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            history TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
