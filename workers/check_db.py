import sqlite3

conn = sqlite3.connect('users.db')
c = conn.cursor()

# Check tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print('Tables:', tables)

# Check telegram_accounts structure if it exists
if 'telegram_accounts' in tables:
    c.execute('PRAGMA table_info(telegram_accounts)')
    cols = [(r[1], r[2]) for r in c.fetchall()]
    print('telegram_accounts columns:', cols)
else:
    print('ERROR: telegram_accounts table does not exist!')

conn.close()
