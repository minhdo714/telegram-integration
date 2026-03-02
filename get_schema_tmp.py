import sqlite3
import os

DB_PATH = 'e:/Projects/Webapp_OF management/telegram-integration/workers/users.db'

def get_schema():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    tables = ['telegram_accounts', 'model_assets', 'ai_config_presets', 'outreach_configs']
    
    for table in tables:
        print(f"--- Schema for {table} ---")
        c.execute(f"PRAGMA table_info({table})")
        for col in c.fetchall():
            print(col)
        print("\n")
        
    conn.close()

if __name__ == "__main__":
    get_schema()
