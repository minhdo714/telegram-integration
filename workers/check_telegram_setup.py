import sqlite3
import os
import sys

DB_PATH = 'e:/Projects/Webapp_OF management/telegram-integration/users.db'

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("="*60)
print("TELEGRAM BOT SETUP CHECK")
print("="*60)

# Check for active accounts
print("\n1. ACTIVE TELEGRAM ACCOUNTS:")
c.execute("SELECT id, phone_number, telegram_username, first_name, status, session_status FROM telegram_accounts WHERE status = 'active'")
accounts = c.fetchall()

if not accounts:
    print("   ⚠️  NO ACTIVE ACCOUNTS FOUND")
    print("   You need to add a Telegram account via the webapp first!")
else:
    for acc in accounts:
        print(f"\n   ✓ Account ID: {acc['id']}")
        print(f"     Phone: {acc['phone_number']}")
        print(f"     Username: @{acc['telegram_username']}")
        print(f"     Name: {acc['first_name']}")
        print(f"     Session Status: {acc['session_status']}")

# Check for face references
print("\n2. MODEL FACE REFERENCES:")
c.execute("SELECT account_id, model_face_ref FROM model_assets WHERE model_face_ref IS NOT NULL")
refs = c.fetchall()

if not refs:
    print("   ⚠️  NO FACE REFERENCES UPLOADED")
    print("   Upload a model face reference via the webapp!")
else:
    for ref in refs:
        face_path = f"e:/Projects/Webapp_OF management/telegram-integration/workers/uploads/{ref['model_face_ref']}"
        exists = os.path.exists(face_path)
        print(f"\n   {'✓' if exists else '✗'} Account ID: {ref['account_id']}")
        print(f"     Path: {ref['model_face_ref']}")
        print(f"     File Exists: {exists}")

# Check bot status via API
print("\n3. BOT STATUS:")
try:
    import requests
    response = requests.get('http://localhost:5000/api/bot/status', timeout=2)
    if response.ok:
        data = response.json()
        if data.get('status') == 'running':
            print(f"   ✓ Bot is RUNNING (PID: {data.get('pid')})")
        else:
            print(f"   ⚠️  Bot is STOPPED")
            print("   Start the bot via the webapp!")
    else:
        print(f"   ✗ Bot API error: {response.status_code}")
except Exception as e:
    print(f"   ✗ Cannot connect to bot API: {e}")

print("\n" + "="*60)
print("TESTING INSTRUCTIONS:")
print("="*60)
print("\nIf all checks pass:")
print("1. Open Telegram app")
print("2. Find your bot account (the account you added)")
print("3. Send a message like: 'send me a sexy pic'")
print("4. Bot will use Seedream 4.5 Edit to generate an image!")
print("\nIf checks failed:")
print("- Add Telegram account: http://localhost:3000")
print("- Upload face reference: Go to account settings")
print("- Start bot: Click 'Start Bot' button on webapp")
print("="*60)

conn.close()
