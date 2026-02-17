
import asyncio
import os
import sqlite3
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from dotenv import load_dotenv

load_dotenv()

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'workers/users.db')

async def monitor_account(account_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT session_string FROM telegram_accounts WHERE id=?", (account_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        print(f"Account {account_id} not found.")
        return

    session_string = row['session_string']
    if isinstance(session_string, bytes):
        session_string = session_string.decode('utf-8')

    client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
    
    @client.on(events.NewMessage())
    async def handler(event):
        sender = await event.get_sender()
        sender_id = event.sender_id
        text = event.message.message
        print(f"[{account_id}] NEW MSG | From: {sender_id} ({getattr(sender, 'username', 'N/A')}) | Private: {event.is_private} | Text: {text}")

    @client.on(events.Raw())
    async def raw_handler(event):
        # Log minimal update type to see if ANY traffic exists
        pass # print(f"[{account_id}] RAW EVENT: {type(event).__name__}")

    print(f"Starting monitor for Account {account_id}...")
    await client.start()
    print(f"Logged in as {(await client.get_me()).username}")
    
    print("Fetching last 5 private dialogs...")
    async for dialog in client.iter_dialogs(limit=5):
        if dialog.is_user:
            print(f"DIALOG: {dialog.name} ({dialog.id}) | Unread: {dialog.unread_count} | Last Msg: {dialog.message.text[:30] if dialog.message else 'N/A'}")

    print("Waiting for messages... (Ctrl+C to stop)")
    
    # Polling loop for ALL messages as backup
    while True:
        try:
            messages = await client.get_messages(None, limit=10)
            if messages:
                print(f"--- GLOBAL RECENT MESSAGES ---")
                for m in messages:
                    sender = await m.get_sender()
                    sender_name = getattr(sender, 'username', 'N/A') or getattr(sender, 'first_name', 'N/A')
                    print(f"[{m.date}] From: {sender_name} ({m.sender_id}) | Text: {m.text[:40]}")
                print(f"-----------------------------")
        except Exception as e:
            print(f"POLL ERROR: {e}")
        await asyncio.sleep(10)

if __name__ == "__main__":
    import sys
    account_id = int(sys.argv[1]) if len(sys.argv) > 1 else 9
    asyncio.run(monitor_account(account_id))
