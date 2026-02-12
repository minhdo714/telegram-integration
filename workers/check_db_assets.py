
import sqlite3
import os

DB_PATH = 'e:/Projects/Webapp_OF management/telegram-integration/users.db'

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("=== Telegram Accounts ===")
c.execute("SELECT id, phone_number, telegram_username, first_name, status FROM telegram_accounts LIMIT 5")
accounts = c.fetchall()

for acc in accounts:
    print(f"\nAccount ID: {acc['id']}")
    print(f"  Phone: {acc['phone_number']}")
    print(f"  Username: {acc['telegram_username']}")
    print(f"  Name: {acc['first_name']}")
    print(f"  Status: {acc['status']}")

print("\n\n=== Model Assets ===")
c.execute("SELECT account_id, model_face_ref, room_bg_ref, opener_images FROM model_assets")
assets = c.fetchall()

for asset in assets:
    print(f"\nAccount ID: {asset['account_id']}")
    print(f"  Face Ref: {asset['model_face_ref']}")
    print(f"  Room Ref: {asset['room_bg_ref']}")
    print(f"  Openers: {asset['opener_images']}")
    
    # Check if face ref file exists
    if asset['model_face_ref']:
        full_path = f"e:/Projects/Webapp_OF management/telegram-integration/workers/uploads/{asset['model_face_ref']}"
        exists = os.path.exists(full_path)
        print(f"  Face Ref Exists: {exists}")
        if exists:
            print(f"  Full Path: {full_path}")

conn.close()
