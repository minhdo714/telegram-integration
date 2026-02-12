import sqlite3
import os

db_path = 'users.db'
if not os.path.exists(db_path):
    print(f"ERROR: {db_path} does not exist!")
else:
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute('SELECT count(*) FROM telegram_accounts')
        count = c.fetchone()[0]
        print(f"Total accounts found: {count}")
        
        if count > 0:
            c.execute('SELECT id, phone_number, length(session_string) FROM telegram_accounts')
            for row in c.fetchall():
                 print(f"Account {row[0]}: {row[1]}, Session Len: {row[2]}")
        
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")
