import sqlite3

DB_PATH = 'e:/Projects/Webapp_OF management/telegram-integration/users.db'

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("ACTIVE ACCOUNTS:")
c.execute("SELECT id, phone_number, telegram_username, status, session_status FROM telegram_accounts")
accounts = c.fetchall()

if not accounts:
    print("NO ACCOUNTS AT ALL")
else:
    for acc in accounts:
        print(f"ID: {acc['id']}, Phone: {acc['phone_number']}, Username: {acc['telegram_username']}, Status: {acc['status']}, Session: {acc['session_status']}")

conn.close()
