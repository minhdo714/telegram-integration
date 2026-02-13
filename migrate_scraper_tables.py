import sqlite3
import os

def migrate_db(db_path):
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create scraped_groups table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scraped_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            telegram_id TEXT UNIQUE,
            title TEXT,
            username TEXT,
            member_count INTEGER,
            is_public BOOLEAN,
            niche TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create scraped_leads table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scraped_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            telegram_id TEXT,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            source_group_id INTEGER,
            last_seen TIMESTAMP,
            status TEXT DEFAULT 'new',
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(telegram_id, username),
            FOREIGN KEY (source_group_id) REFERENCES scraped_groups (id)
        )
    ''')

    # Create outreach_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS outreach_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            lead_id INTEGER,
            telegram_id TEXT,
            username TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            FOREIGN KEY (lead_id) REFERENCES scraped_leads (id)
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Migration completed for {db_path}")

if __name__ == "__main__":
    migrate_db("workers/users.db")
    # Also migrate root db if it's used for something else, but prioritizing workers/users.db
    if os.path.exists("users.db"):
        migrate_db("users.db")
