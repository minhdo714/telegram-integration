import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')

def list_columns(cursor, table_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return [info[1] for info in cursor.fetchall()]

def add_column_if_not_exists(cursor, table_name, column_name, column_type):
    columns = list_columns(cursor, table_name)
    if column_name not in columns:
        print(f"Adding {column_name} to {table_name}...")
        try:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            print(f"Successfully added {column_name}")
        except Exception as e:
            print(f"Error adding {column_name}: {e}")
    else:
        print(f"Column {column_name} already exists in {table_name}")

def update_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Update ai_config_presets
    print("\nUpdating ai_config_presets...")
    add_column_if_not_exists(c, 'ai_config_presets', 'outreach_message', 'TEXT')
    add_column_if_not_exists(c, 'ai_config_presets', 'example_chatflow', 'TEXT')

    # Update model_assets
    print("\nUpdating model_assets...")
    add_column_if_not_exists(c, 'model_assets', 'outreach_message', 'TEXT')
    add_column_if_not_exists(c, 'model_assets', 'example_chatflow', 'TEXT')

    conn.commit()
    conn.close()
    print("\nSchema update complete.")

if __name__ == "__main__":
    update_schema()
