import sqlite3
import os

DB_PATH = 'users.db'

def seed():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (1, 'demo@example.com', 'dummy_hash')")
        conn.commit()
        print("User seeded successfully.")
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed()
