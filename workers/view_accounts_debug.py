
import sqlite3
import os

DB_PATH = os.path.join('workers', 'users.db')
if not os.path.exists(DB_PATH):
    print(f"Error: {DB_PATH} not found")
    exit(1)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("=== ALL TELEGRAM ACCOUNTS ===")
c.execute('SELECT * FROM telegram_accounts')
rows = c.fetchall()

if not rows:
    print("No accounts found in database.")
else:
    for row in rows:
        print(f"ID: {row['id']}")
        print(f"  User ID: {row['user_id']}")
        print(f"  Phone: {row['phone_number']}")
        print(f"  Session Status: {row['session_status']}")
        try:
            print(f"  Ownership: {row['account_ownership']}")
        except:
            pass
        print("-" * 30)

conn.close()
