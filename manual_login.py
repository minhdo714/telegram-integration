
import os
import sys
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE_NUMBER = "17143329798"

if not API_ID or not API_HASH:
    print("Error: Missing API credentials in .env")
    sys.exit(1)

async def manual_login():
    print(f"Starting manual login for {PHONE_NUMBER}...")
    client = TelegramClient(StringSession(), int(API_ID), API_HASH)
    
    await client.connect()
    
    if not await client.is_user_authorized():
        print(f"Requesting code for {PHONE_NUMBER}...")
        try:
            sent_code = await client.send_code_request(PHONE_NUMBER)
            print("✅ Code sent! Check your Telegram app or SMS.")
            print(f"Phone Hash: {sent_code.phone_code_hash}")
            
            # Interactive input with loop for robustness
            code = ""
            while not code.strip():
                try:
                    # Flush stdout/stdin?
                    await asyncio.sleep(0.1)
                    code = await asyncio.to_thread(input, "ENTER THE CODE YOU RECEIVED: ")
                    if not code.strip():
                        print("Code cannot be empty. Try again.")
                except EOFError:
                    print("EOF detected on input. Retrying...")
                    await asyncio.sleep(1)
            
            print(f"Verifying code: '{code}'...")
            await client.sign_in(PHONE_NUMBER, code, phone_code_hash=sent_code.phone_code_hash)
            
            print("✅ Login Successful!")
            me = await client.get_me()
            print(f"Logged in as: {me.first_name} (@{me.username})")
            
            session_string = client.session.save()
            print("\nSaved Session String (COPY THIS):")
            print("--------------------------------------------------")
            print(session_string)
            print("--------------------------------------------------")
            
            # Update DB directly
            import sqlite3
            conn = sqlite3.connect('workers/users.db')
            c = conn.cursor()
            c.execute('UPDATE telegram_accounts SET session_string = ?, session_status = ? WHERE phone_number = ?', 
                      (session_string, 'active', PHONE_NUMBER))
            conn.commit()
            print(f"Rows updated: {c.rowcount}")
            if c.rowcount > 0:
                print(f"✅ Automatically updated database for account {PHONE_NUMBER}")
            else:
                print(f"⚠️ Could not find account {PHONE_NUMBER} in database to update.")
            conn.close()
            
        except Exception as e:
            print(f"❌ Login failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("✅ Already authorized!")
        session_string = client.session.save()
        print(f"Session String: {session_string}")

    await client.disconnect()

if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(manual_login())
