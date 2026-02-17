import asyncio
import os
import sys
import logging
import traceback
from telethon import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv

# Force stdout to unbuffered
sys.stdout.reconfigure(encoding='utf-8')

def log(msg):
    print(f"DEBUG_SCRIPT: {msg}", flush=True)

async def test_send():
    try:
        log("Starting...")
        load_dotenv()
        api_id = os.getenv('TELEGRAM_API_ID')
        api_hash = os.getenv('TELEGRAM_API_HASH')
        
        import sqlite3
        conn = sqlite3.connect(os.path.join('workers', 'users.db'))
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT session_string FROM telegram_accounts WHERE id = 9")
        row = c.fetchone()
        conn.close()
        
        if not row:
            log("Account 9 not found")
            return

        session_string = row['session_string']
        client = TelegramClient(StringSession(session_string), int(api_id), api_hash)
        
        log("Connecting to Telegram...")
        await client.connect()
        log("Connected.")
        
        if not await client.is_user_authorized():
            log("Not authorized!")
            return
            
        me = await client.get_me()
        log(f"Logged in as {me.username}")
        
        target = 'me' 
        
        # TEST 1
        log("--- TEST 1: Sending Text ---")
        try:
            await client.send_message(target, "Debug test: Text message")
            log("Text sent successfully.")
        except Exception as e:
            log(f"Failed to send text: {e}")
        
        # TEST 2
        log("--- TEST 2: Sending Static Image URL ---")
        static_url = "https://picsum.photos/200/300" 
        try:
            msg = await client.send_file(target, static_url, caption="Debug test: Static Image")
            log(f"Static image sent: ID {msg.id}")
        except Exception as e:
            log(f"Failed to send static image: {e}")

        # TEST 3
        log("--- TEST 3: Sending Local File ---")
        local_path = os.path.join("workers", "uploads", "9", "face", "1770724709_a0f6ce20-edfe-43d5-904a-bef5d48ab99d_0.jpg")
        log(f"Using local path: {local_path}")
        
        if os.path.exists(local_path):
            try:
                await client.send_file(target, local_path, caption="Debug test: Local File")
                log("Local file sent successfully.")
            except Exception as e:
                log(f"Failed to send local file: {e}")
                
            # TEST 4
            log("--- TEST 4: Full Kie Generation & Send ---")
            try:
                from workers.kie_client import KieClient
                kie = KieClient()
                prompt = "A futuristic cyberpunk city, neon lights, rain"
                log(f"Generating image... Prompt: {prompt}")
                
                # Use to_thread to simulate bot_runner behavior
                result = await asyncio.to_thread(kie.generate_image, prompt, face_ref_path=local_path)
                log(f"Generation Result: {result}")
                
                if result.get('url'):
                    await client.send_file(target, result['url'], caption=f"Debug test: Kie Gen - {prompt}")
                    log("Kie Generated Image Sent!")
                else:
                    log(f"Kie Generation Failed: {result}")
            except Exception as e:
                log(f"Failed Kie test: {e}")
                traceback.print_exc()
        else:
            log("Local file not found! Skipping TEST 3 and 4.")

        await client.disconnect()
        log("Disconnected.")

    except Exception as e:
        log(f"CRITICAL ERROR: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_send())
