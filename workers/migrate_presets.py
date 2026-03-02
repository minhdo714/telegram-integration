import sqlite3
import os

def migrate():
    # Use path relative to this script
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check current columns in ai_config_presets
    c.execute("PRAGMA table_info(ai_config_presets)")
    columns = [col[1] for col in c.fetchall()]
    print(f"Current columns in ai_config_presets: {columns}")

    new_presets_columns = [
        ('opener_images', 'TEXT'),
        ('model_face_ref', 'TEXT'),
        ('model_body_ref', 'TEXT'),
        ('room_bg_ref', 'TEXT')
    ]

    for col_name, col_type in new_presets_columns:
        if col_name not in columns:
            print(f"Adding column {col_name} to ai_config_presets...")
            c.execute(f"ALTER TABLE ai_config_presets ADD COLUMN {col_name} {col_type}")
    
    # Check current columns in model_assets
    c.execute("PRAGMA table_info(model_assets)")
    columns_assets = [col[1] for col in c.fetchall()]
    print(f"Current columns in model_assets: {columns_assets}")
    
    if 'context' not in columns_assets:
        print("Adding column context to model_assets...")
        # Default to 'engagement' for existing data
        c.execute("ALTER TABLE model_assets ADD COLUMN context TEXT DEFAULT 'engagement'")
        # Also add unique index to prevent duplicate (account_id, context) pairs
        try:
            c.execute("CREATE UNIQUE INDEX idx_account_context ON model_assets(account_id, context)")
        except Exception as e:
            print(f"Warning: Could not create unique index on model_assets: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
