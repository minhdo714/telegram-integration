import sqlite3
import os

def migrate_outreach():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 1. Create outreach_configs table (similar to ai_config_presets)
    c.execute('''
        CREATE TABLE IF NOT EXISTS outreach_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            system_prompt TEXT,
            model_provider TEXT,
            model_name TEXT,
            temperature REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            opener_images TEXT,
            model_face_ref TEXT,
            model_body_ref TEXT,
            room_bg_ref TEXT,
            outreach_message TEXT,
            example_chatflow TEXT,
            blast_list TEXT
        )
    ''')
    print("Table outreach_configs created or already exists.")

    # 2. Add active_outreach_config_id to telegram_accounts
    c.execute("PRAGMA table_info(telegram_accounts)")
    columns = [col[1] for col in c.fetchall()]
    
    if 'active_outreach_config_id' not in columns:
        print("Adding column active_outreach_config_id to telegram_accounts...")
        c.execute("ALTER TABLE telegram_accounts ADD COLUMN active_outreach_config_id INTEGER")
    
    conn.commit()
    conn.close()
    print("Outreach migration complete.")

if __name__ == "__main__":
    migrate_outreach()
