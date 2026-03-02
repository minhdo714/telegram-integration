
import sqlite3
import os

def check_sessions():
    db_path = 'workers/users.db'
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, phone_number, session_string FROM telegram_accounts WHERE status = 'active'")
    rows = c.fetchall()
    for row in rows:
        session = row['session_string']
        isValid = "INVALID"
        if session and len(session) > 50:
             isValid = "SEEMS OK"
        print(f"Acc:{row['id']} | Phone:{row['phone_number']} | Session Length:{len(session) if session else 0} | Status:{isValid}")
    conn.close()

if __name__ == '__main__':
    check_sessions()
