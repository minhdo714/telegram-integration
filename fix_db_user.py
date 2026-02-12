import sqlite3
import os

DB_PATH = 'workers/users.db'

try:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check if user exists
    c.execute('SELECT * FROM users WHERE id = 1')
    user = c.fetchone()
    
    if not user:
        print("User 1 missing. Inserting...")
        # Check schema to match columns
        c.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in c.fetchall()]
        print(f"Columns: {columns}")
        
        # Insert with minimal required fields based on schema knowledge or defaults
        # Assuming minimal fields: id, email, password_hash based on previous attempts
        # But let's be safe and rely on what we see or use simpler insert if possible
        
        # If schema is complex, let's just try inserting with known fields. 
        # auth_handler.py usually has the schema.
        
        c.execute("INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (1, 'admin@example.com', 'dummyhash')")
        conn.commit()
        print("User 1 inserted successfully.")
    else:
        print("User 1 already exists.")
        
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
