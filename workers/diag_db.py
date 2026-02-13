import sqlite3
import os

DB_PATH = 'workers/users.db'

def check_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    print("--- Telegram Accounts ---")
    c.execute('SELECT id, phone_number, telegram_username, session_status FROM telegram_accounts')
    accounts = c.fetchall()
    for acc in accounts:
        print(acc)

    print("\n--- Scraped Groups ---")
    c.execute('SELECT id, telegram_id, title, username FROM scraped_groups')
    groups = c.fetchall()
    for g in groups:
        print(g)

    print("\n--- Scraped Leads (Last 5) ---")
    c.execute('SELECT id, telegram_id, username, source_group_id FROM scraped_leads ORDER BY id DESC LIMIT 5')
    leads = c.fetchall()
    for l in leads:
        print(l)

    conn.close()

if __name__ == "__main__":
    check_db()
