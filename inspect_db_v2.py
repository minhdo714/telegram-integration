import sqlite3
try:
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT id, phone_number, length(session_string), session_string FROM telegram_accounts')
    for row in c.fetchall():
        print(f"ID: {row[0]}, Phone: {row[1]}, Len: {row[2]}, Val: {row[3]}")
    conn.close()
except Exception as e:
    print(e)
