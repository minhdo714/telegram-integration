import sqlite3
import os

def migrate():
    db_path = os.path.join(os.getcwd(), 'telegram-integration/workers/users.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check current columns in ai_config_presets
    c.execute("PRAGMA table_info(ai_config_presets)")
    columns = [col[1] for col in c.fetchall()]
    print(f"Current columns in ai_config_presets: {columns}")

    new_columns = [
        ('opener_images', 'TEXT'),
        ('model_face_ref', 'TEXT'),
        ('model_body_ref', 'TEXT'),
        ('room_bg_ref', 'TEXT')
    ]

    for col_name, col_type in new_columns:
        if col_name not in columns:
            print(f"Adding column {col_name} to ai_config_presets...")
            c.execute(f"ALTER TABLE ai_config_presets ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
