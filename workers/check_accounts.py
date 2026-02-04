import sqlite3

conn = sqlite3.connect('users.db')
c = conn.cursor()

# Check what accounts exist
c.execute("SELECT * FROM telegram_accounts")
accounts = c.fetchall()

print(f"Found {len(accounts)} account(s):")
print("-" * 80)

for account in accounts:
    print(f"ID: {account[0]}")
    print(f"User ID: {account[1]}")
    print(f"Phone: {account[2]}")
    print(f"Session String (first 50 chars): {account[3][:50]}...")
    print(f"Status: {account[4]}")
    print(f"Created At: {account[5]}")
    print("-" * 80)

conn.close()
