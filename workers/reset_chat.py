
import sqlite3
import os

DB_PATH = 'users.db'

def reset_all_sessions():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Count before delete
        c.execute("SELECT COUNT(*) FROM chat_sessions")
        sessions_count = c.fetchone()[0]
        
        c.execute("DELETE FROM chat_sessions")
        c.execute("DELETE FROM chat_messages")
        
        conn.commit()
        conn.close()
        print(f"Successfully deleted {sessions_count} sessions and all messages.")
        print("Chat memory is clean.")
    except Exception as e:
        print(f"Error resetting sessions: {e}")

if __name__ == "__main__":
    reset_all_sessions()
