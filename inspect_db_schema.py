import sqlite3
import os

def inspect_db(db_path):
    # Ensure we use the correct relative path if called from root
    if not os.path.isabs(db_path):
        db_path = os.path.join(os.getcwd(), db_path)
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print(f"Tables index in {db_path}:")
    for table in tables:
        table_name = table[0]
        print(f"\nTable: {table_name}")
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")

    conn.close()

if __name__ == "__main__":
    inspect_db("workers/users.db")
    inspect_db("users.db")
