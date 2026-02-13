import sqlite3
import os

DB_PATH = 'workers/users.db'

def update_schema():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Update telegram_accounts
    cols_to_add = [
        ('proxy_url', 'TEXT'),
        ('active_config_id', 'INTEGER')
    ]

    for col_name, col_type in cols_to_add:
        try:
            c.execute(f'ALTER TABLE telegram_accounts ADD COLUMN {col_name} {col_type}')
            print(f"Added column {col_name} to telegram_accounts")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e):
                print(f"Column {col_name} already exists in telegram_accounts")
            else:
                print(f"Error adding {col_name}: {e}")

    # 2. Create scraped_groups
    c.execute('''
        CREATE TABLE IF NOT EXISTS scraped_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT UNIQUE,
            title TEXT,
            username TEXT,
            member_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("Ensured scraped_groups table exists")

    # 3. Create scraped_leads
    c.execute('''
        CREATE TABLE IF NOT EXISTS scraped_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            telegram_id TEXT UNIQUE,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            source_group_id INTEGER,
            status TEXT DEFAULT 'new',
            last_seen TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(source_group_id) REFERENCES scraped_groups(id)
        )
    ''')
    print("Ensured scraped_leads table exists")

    # 4. Create outreach_history
    c.execute('''
        CREATE TABLE IF NOT EXISTS outreach_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            lead_id INTEGER,
            message TEXT,
            status TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(account_id) REFERENCES telegram_accounts(id),
            FOREIGN KEY(lead_id) REFERENCES scraped_leads(id)
        )
    ''')
    print("Ensured outreach_history table exists")

    conn.commit()
    conn.close()
    print("Schema update complete")

if __name__ == "__main__":
    update_schema()
