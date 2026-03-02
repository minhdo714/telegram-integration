import sqlite3
import os

DB_PATH = 'workers/users.db'

def check_db():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    print("--- Telegram Accounts ---")
    c.execute("SELECT id, first_name, last_name, telegram_username, active_config_id, active_outreach_config_id FROM telegram_accounts")
    accounts = c.fetchall()
    for acc in accounts:
        print(dict(acc))

    print("\n--- Model Assets ---")
    c.execute("SELECT * FROM model_assets")
    assets = c.fetchall()
    for asset in assets:
        print(dict(asset))

    print("\n--- AI Config Presets ---")
    c.execute("SELECT id, name FROM ai_config_presets")
    presets = c.fetchall()
    for p in presets:
        print(dict(p))

    conn.close()

if __name__ == "__main__":
    check_db()
