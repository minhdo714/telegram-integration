
import sqlite3
import os

def read_last_convo():
    db_path = 'workers/users.db'
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, remote_user_id FROM chat_sessions ORDER BY last_message_at DESC LIMIT 1")
    session = c.fetchone()
    if not session:
        print("No sessions found.")
        return
    
    session_id = session['id']
    print(f"Reading Session ID: {session_id} (User: {session['remote_user_id']})")
    print("-" * 30)
    
    c.execute("SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    rows = c.fetchall()
    for row in rows:
        print(f"[{row['role']}] {row['content']}")
    conn.close()

if __name__ == '__main__':
    read_last_convo()
