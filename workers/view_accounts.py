import sqlite3

conn = sqlite3.connect('users.db')
c = conn.cursor()

# Get column names
c.execute("PRAGMA table_info(telegram_accounts)")
columns = [row[1] for row in c.fetchall()]
print("Columns:", columns)
print("=" * 100)

# Check what accounts exist
c.execute("SELECT * FROM telegram_accounts")
accounts = c.fetchall()

print(f"\nFound {len(accounts)} account(s):\n")

for account in accounts:
    for i, col in enumerate(columns):
        value = account[i]
        if col == 'session_string' and value:
            value = value[:30] + '...' if len(value) > 30 else value
        print(f"{col}: {value}")
    print("-" * 100)

conn.close()
