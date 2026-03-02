
import sqlite3
import os

def list_accounts():
    db_path = 'workers/users.db'
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, phone_number, session_status, status FROM telegram_accounts WHERE status = 'active'")
    rows = c.fetchall()
    for row in rows:
        print(f"Acc:{row['id']} | Phone:{row['phone_number']} | Session:{row['session_status']} | Status:{row['status']}")
    conn.close()

if __name__ == '__main__':
    list_accounts()
