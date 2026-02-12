import os
import asyncio
import sqlite3
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from dotenv import load_dotenv

# Setup logging to console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load env
load_dotenv()
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')

async def main():
    print("--- DIAGNOSTIC BOT STARTED ---")
    print(f"DB Path: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, phone_number, session_string FROM telegram_accounts WHERE status = 'active'")
    accounts = c.fetchall()
    conn.close()
    
    if not accounts:
        print("❌ No active accounts found in DB!")
        return

    print(f"✅ Found {len(accounts)} active accounts.")

    for acc in accounts:
        print(f"Connecting to account {acc['id']} ({acc['phone_number']})...")
        try:
            client = TelegramClient(StringSession(acc['session_string']), API_ID, API_HASH)
            await client.connect()
            
            me = await client.get_me()
            if not me:
                print(f"❌ Account {acc['phone_number']} failed to login (session invalid?)")
                continue
                
            print(f"✅ Logged in as: {me.username} (ID: {me.id})")
            print("👀 Waiting for messages... (Send a message now!)")

            @client.on(events.NewMessage)
            async def handler(event):
                sender = await event.get_sender()
                print(f"📩 RECEIVED MESSAGE from {sender.id}: {event.text}")
                await event.reply(f"Diagnostic ACK: I received '{event.text}'")
                print("Diaganostic reply sent.")

            # Keep running
            await client.run_until_disconnected()
            
        except Exception as e:
            print(f"❌ Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
