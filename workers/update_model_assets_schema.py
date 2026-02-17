import sqlite3
import os

DB_PATH = os.path.join('workers', 'users.db')

def update_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    columns_to_add = [
        ('outreach_message', 'TEXT'),
        ('example_chatflow', 'TEXT'),
        ('blast_list', 'TEXT')
    ]

    print("Updating model_assets table...")
    for col_name, col_type in columns_to_add:
        try:
            c.execute(f'ALTER TABLE model_assets ADD COLUMN {col_name} {col_type}')
            print(f"Added column: {col_name}")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
