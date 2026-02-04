import sqlite3
import json

conn = sqlite3.connect('users.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT * FROM telegram_accounts LIMIT 1")
row = c.fetchone()

if row:
    print("Account data:")
    print(json.dumps(dict(row), indent=2, default=str))
else:
    print("No accounts found")

conn.close()
