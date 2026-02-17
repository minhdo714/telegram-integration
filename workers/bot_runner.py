
import asyncio
import os
import sys
import logging
import sqlite3
import json
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from dotenv import load_dotenv
from ai_handler import AIHandler

# Configure logging
bot_log_path = '/tmp/bot.log' if os.name != 'nt' else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bot.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(bot_log_path),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')

try:
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))
    API_ID = os.getenv('TELEGRAM_API_ID')
    API_HASH = os.getenv('TELEGRAM_API_HASH')
    ai_handler = AIHandler()
    clients = {} # account_id -> client
except Exception as e:
    logger.critical(f"Failed to import dependencies: {e}")
    sys.exit(1)

async def process_incoming_message(client, account_id, sender_id, message_text, username, chat_id, reply_to_msg_id=None):
    """Core logic to process a single message, shared by event handler and polling"""
    try:
        logger.info(f"📨 PROCESSING: [Acc:{account_id}] From:{sender_id} Msg:{message_text[:50]}")
        
        # 1. PING PONG TEST
        if message_text.strip().lower() == '/ping':
            await client.send_message(chat_id, "🏓 PONG! I am online and hearing you.", reply_to=reply_to_msg_id)
            return

        # 2. AI Processing
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(ai_handler.handle_message, account_id, sender_id, message_text, username),
                timeout=60.0
            )
            
            if not response or not isinstance(response, dict):
                response = {'text': "hey sorry, my brain glitched (INVALID_RESP)... can you say that again? 😅"}
            
            if not response.get('text') and not response.get('image_path') and not response.get('async_task'):
                 response['text'] = "hey! sorry i was spacing out... what's up? 😊"

        except asyncio.TimeoutError:
            response = {'text': "ugh sorry, i'm deep in thought (TIMEOUT)... can you say that again? 🧠⌛"}
        except Exception as e:
            logger.error(f"AI Error: {e}", exc_info=True)
            response = {'text': f"omg sorry, something went wrong (CRASH: {str(e)[:40]})... 😅"}

        # 3. Handle Response
        logger.info(f"DEBUG RESP: {json.dumps(response, default=str)[:200]}") # Debug print
        if response.get('text'):
            delay = response.get('delay', 0)
            if delay > 0:
                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(min(delay, 10)) # Cap delay
            
            await client.send_message(chat_id, response['text'], reply_to=reply_to_msg_id)
            logger.info(f"[OK] Sent reply to {sender_id}")

        # 4. Async Tasks (Image Generation Handling)
        if response.get('async_task'):
             task = response['async_task']
             if task.get('type') == 'image_gen':
                 logger.info(f"Starting async image generation for {sender_id} with prompt: {task.get('prompt')}")
                 
                 try:
                     # Execute blocking API call in thread to keep bot responsive
                     img_result = await asyncio.to_thread(
                         ai_handler.kie_client.generate_image, 
                         task.get('prompt'), 
                         face_ref_path=task.get('face_path')
                     )
                     
                     if img_result and img_result.get('url'):
                         logger.info(f"Image generated successfully: {img_result['url']}")
                         # Send the image
                         await client.send_file(chat_id, img_result['url'], caption="here u go 😘", reply_to=reply_to_msg_id)
                     else:
                         error_msg = img_result.get('error', 'Unknown error') if img_result else 'Unknown error'
                         logger.error(f"Image generation failed: {error_msg}")
                         # Optional: Send apology message
                         await client.send_message(chat_id, "ugh my camera app is glitching 😭 sorry babe")
                 except Exception as e:
                     logger.error(f"Exception in async image task: {e}")
                     await client.send_message(chat_id, "ugh my phone died while taking it 😭 give me a sec")

    except Exception as e:
        logger.error(f"Failed to process message: {e}", exc_info=True)

async def start_bot(account_id, session_string):
    """Start a single bot instance for an account"""
    try:
        logger.info(f"Starting bot for account {account_id}")
        
        if isinstance(session_string, bytes):
            session_string = session_string.decode('utf-8')
            
        client = TelegramClient(StringSession(session_string), API_ID, API_HASH, sequential_updates=True)
        
        logger.info(f"Connecting client for account {account_id}...")
        await client.connect()
        
        if not await client.is_user_authorized():
            logger.error(f"Account {account_id} NOT AUTHORIZED. Session string may be invalid or expired. Skipping.")
            return

        me = await client.get_me()
        logger.info(f"SUCCESS: Listening for Account {account_id} as {me.username} ({me.id})")

        processed_msg_ids = set()

        @client.on(events.NewMessage(incoming=True))
        async def handler(event):
            if not event.is_private or event.id in processed_msg_ids:
                return
            processed_msg_ids.add(event.id)
            
            sender = await event.get_sender()
            await process_incoming_message(
                client, account_id, event.sender_id, event.message.message, 
                getattr(sender, 'username', None), event.chat_id, event.id
            )

        # Polling Fallback
        async def poll_loop():
            logger.info(f"POLLING STARTED for {account_id}")
            # Warm up cache
            await client.get_dialogs(limit=20)
            
            while True:
                try:
                    # Get last 20 messages globally
                    messages = await client.get_messages(None, limit=20)
                    for m in messages:
                        # SUPER VERBOSE LOG
                        # logger.debug(f"POLL_DEBUG: Seen {m.id} | Private: {m.is_private} | Out: {m.out} | Text: {m.text[:20] if m.text else 'N/A'}")
                        
                        if m.id not in processed_msg_ids and m.is_private and not m.out:
                            processed_msg_ids.add(m.id)
                            logger.info(f"POLL_MATCH: Found missed message {m.id} from {m.sender_id}")
                            sender = await m.get_sender()
                            await process_incoming_message(
                                client, account_id, m.sender_id, m.text, 
                                getattr(sender, 'username', None), m.chat_id, m.id
                            )
                except Exception as e:
                    logger.error(f"Poll Error: {e}")
                
                # logger.info(f"POLL_HEARTBEAT for {account_id}")
                await asyncio.sleep(15)

        asyncio.create_task(poll_loop())
        await client.run_until_disconnected()

    except Exception as e:
        logger.error(f"Bot crash for {account_id}: {e}", exc_info=True)

async def main():
    logger.info("Bot Runner starting...")
    running_tasks = {}
    
    while True:
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT id, session_string FROM telegram_accounts WHERE status = 'active' AND session_status = 'active'")
            accounts = [dict(r) for r in c.fetchall()]
            conn.close()

            # Cleanup crashed or finished tasks
            for acc_id, task in list(running_tasks.items()):
                if task.done():
                    try:
                        exc = task.exception()
                        if exc:
                            logger.error(f"Bot task for account {acc_id} CRASHED: {exc}")
                        else:
                            logger.warning(f"Bot task for account {acc_id} finished unexpectedly.")
                    except asyncio.CancelledError:
                        logger.info(f"Bot task for account {acc_id} was cancelled.")
                    except Exception as e:
                         logger.error(f"Error checking task {acc_id}: {e}")
                    
                    # Remove from tracking so it can be restarted per main loop logic
                    del running_tasks[acc_id]

            # Start new bots
            active_ids = {a['id'] for a in accounts}
            for acc in accounts:
                if acc['id'] not in running_tasks:
                    logger.info(f"Starting/Restarting bot for account {acc['id']}")
                    running_tasks[acc['id']] = asyncio.create_task(start_bot(acc['id'], acc['session_string']))
            
            # Stop bots for inactive accounts
            for acc_id in list(running_tasks.keys()):
                if acc_id not in active_ids:
                    logger.info(f"Stopping bot for inactive account {acc_id}")
                    running_tasks[acc_id].cancel()
                    del running_tasks[acc_id]

            # Heartbeat
            logger.info(f"HEARTBEAT: {len(running_tasks)} bots active")
            
        except Exception as e:
            logger.error(f"Main loop error: {e}")
            
        await asyncio.sleep(10) # Check every 10s instead of 30s for faster recovery

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
