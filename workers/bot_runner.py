
import asyncio
import os
import sys
import logging
import sqlite3
import json
import random
import argparse
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
        logging.FileHandler(bot_log_path, encoding='utf-8'),
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
    
    # Global bot type from CLI
    BOT_TYPE = 'engagement'
except Exception as e:
    logger.critical(f"Failed to import dependencies: {e}")
    sys.exit(1)

def get_fallback_image(account_id, display_name=None):
    """Get a random opener image from account's library as fallback, with name overlay applied.
    Works with both legacy local paths and new /api/assets/image/ proxy paths."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Try to get opener images based on BOT_TYPE
        if BOT_TYPE == 'outreach':
            c.execute('''
                SELECT oc.opener_images
                FROM telegram_accounts ta
                LEFT JOIN outreach_configs oc ON ta.active_outreach_config_id = oc.id
                WHERE ta.id = ?
            ''', (account_id,))
        else:
            c.execute('''
                SELECT ac.opener_images
                FROM telegram_accounts ta
                LEFT JOIN ai_config_presets ac ON ta.active_config_id = ac.id
                WHERE ta.id = ?
            ''', (account_id,))
        
        result = c.fetchone()
        opener_images_json = result['opener_images'] if result else None
        
        # Fallback to model_assets if no preset
        if not opener_images_json:
            c.execute('SELECT opener_images FROM model_assets WHERE account_id = ?', (account_id,))
            result = c.fetchone()
            opener_images_json = result['opener_images'] if result else None
        
        conn.close()
        
        if opener_images_json:
            opener_images = json.loads(opener_images_json)
            if opener_images and len(opener_images) > 0:
                # Pick random image
                selected_image = random.choice(opener_images)
                
                upload_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

                # Use ai_handler._resolve_image_path to handle both local paths
                # and the new /api/assets/image/ proxy URL format correctly.
                image_path = ai_handler._resolve_image_path(selected_image, upload_base)
                
                if image_path and os.path.exists(image_path):
                    # Apply handwritten name overlay if we have a display_name
                    if display_name:
                        try:
                            from image_overlay import overlay_name_on_image
                            overlaid_path = overlay_name_on_image(image_path, display_name)
                            if overlaid_path and os.path.exists(overlaid_path):
                                return overlaid_path
                        except Exception as overlay_err:
                            logger.warning(f"Overlay failed in fallback image: {overlay_err}")
                    return image_path
                else:
                    logger.warning(f"Fallback image could not be resolved: {selected_image}")
        
        return None
    except Exception as e:
        logger.error(f"Failed to get fallback image: {e}")
        return None

async def process_incoming_message(client, account_id, sender_id, message_text, username, chat_id, reply_to_msg_id=None, first_name=None):
    """Core logic to process a single message, shared by event handler and polling"""
    try:
        # Build the best display name: first_name > @username > None
        display_name = first_name or username
        logger.info(f"PROCESSING: [Acc:{account_id}] From:{sender_id} Name:{display_name} Msg:{message_text[:50]}")
        
        # 1. PING PONG TEST
        if message_text.strip().lower() == '/ping':
            await client.send_message(chat_id, "🏓 PONG! I am online and hearing you.", reply_to=reply_to_msg_id)
            return

        # 2. AI Processing
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(ai_handler.handle_message, account_id, sender_id, message_text, display_name, bot_type=BOT_TYPE),
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

        # 3b. Send opener image if present (with handwritten name overlay)
        if response.get('image_path'):
            img_path = response['image_path']
            if os.path.exists(img_path):
                try:
                    await client.send_file(chat_id, img_path, reply_to=reply_to_msg_id)
                    logger.info(f"[OK] Sent opener image to {sender_id}: {img_path}")
                except Exception as img_err:
                    logger.error(f"Failed to send opener image: {img_err}")
            else:
                logger.warning(f"Opener image not found: {img_path}")

        # 4. Async Tasks (Image Generation Handling)
        if response.get('async_task'):
             task = response['async_task']
             if task.get('type') == 'image_gen':
                 prompt = task.get('prompt') or ''
                 # Use the raw short user request for Kie (avoids long-prompt timeouts).
                 # Fall back to the LLM text if no kie_prompt is set.
                 kie_prompt = task.get('kie_prompt') or prompt
                 
                 # ── PROMPT GUARD ──────────────────────────────────────────────────────
                 # The prompt is the LLM's reply text. If the bot responded to spam with
                 # "Spam blocked." or "🚫", we must NOT pass that as an image prompt.
                 _p_lower = prompt.lower().strip()
                 _spam_keywords = [
                     'spam', 'blocked', 'scam', 'no photo', 'no image', 'not engaging',
                     'have a good day', 'not interested', 'inappropriate', 'no thanks',
                     'reported', 'restrict', 'flood', 'limit', 'brain is a bit slow',
                     'sorry, my brain', 'glitched',
                 ]
                 _is_spam_prompt = (
                     len(_p_lower) < 10  # Too short to be a real prompt
                     or any(kw in _p_lower for kw in _spam_keywords)
                     or all(c in ' .!?,:;-–—\n\t' for c in prompt)  # only emoji/punct
                 )
                 if _is_spam_prompt:
                     logger.warning(f"[IMG GUARD] Blocked image gen — suspicious prompt: {prompt[:80]!r}")
                 else:
                     logger.info(f"Starting async image generation for {sender_id} with prompt: {kie_prompt[:80]}")
                     try:
                         # Execute blocking API call in thread to keep bot responsive
                         img_result = await asyncio.to_thread(
                             ai_handler.kie_client.generate_image, 
                             kie_prompt,  # Use raw short request, not LLM paragraph
                             face_ref_path=task.get('face_path')
                         )
                         
                         if img_result and img_result.get('url'):
                             logger.info(f"Image generated successfully: {img_result['url']}")
                             # Use the AI-generated seductive description as the caption
                             caption = prompt if prompt else "just for you baby 🔥"
                             await client.send_file(chat_id, img_result['url'], caption=caption, reply_to=reply_to_msg_id)
                         else:
                             error_msg = img_result.get('error', 'Unknown error') if img_result else 'Unknown error'
                             logger.error(f"Image generation failed: {error_msg}")
                             
                             # FALLBACK: Try to send an opener image instead
                             fallback_image = get_fallback_image(account_id, display_name)
                             
                             if fallback_image:
                                 # Random excuse messages
                                 excuses = [
                                     "omg sorry my phone was acting up... here's one i took earlier 😘",
                                     "ugh my camera app crashed lol, but here's a good one from yesterday 💕",
                                     "sorry babe my phone's being weird, sending you this one instead 😉",
                                     "hold on my camera glitched... but i got this one for you 💋",
                                     "ugh technical difficulties 😭 but here's something to hold you over 😘"
                                 ]
                                 excuse = random.choice(excuses)
                                 logger.info(f"Sending fallback image for failed generation: {fallback_image}")
                                 await client.send_file(chat_id, fallback_image, caption=excuse, reply_to=reply_to_msg_id)
                             else:
                                 # No fallback available, send text apology
                                 await client.send_message(chat_id, "ugh my camera app is glitching 😭 sorry babe")
                     except Exception as e:
                         logger.error(f"Exception in async image task: {e}")
                         
                         # FALLBACK: Try to send an opener image on exception too
                         try:
                             fallback_image = get_fallback_image(account_id, display_name)
                             if fallback_image:
                                 excuses = [
                                     "omg my phone just died while taking that 😭 but here's another one 💕",
                                     "sorry babe something went wrong... sending you this instead 😘",
                                     "ugh my phone is being so annoying rn, here's one from earlier 💋"
                                 ]
                                 excuse = random.choice(excuses)
                                 logger.info(f"Sending fallback image after exception: {fallback_image}")
                                 await client.send_file(chat_id, fallback_image, caption=excuse, reply_to=reply_to_msg_id)
                             else:
                                 await client.send_message(chat_id, "ugh my phone died while taking it 😭 give me a sec")
                         except Exception as fallback_error:
                             logger.error(f"Fallback also failed: {fallback_error}")
                             await client.send_message(chat_id, "ugh my phone died while taking it 😭 give me a sec")

    except Exception as e:
        logger.error(f"Failed to process message: {e}", exc_info=True)

async def start_bot(account_id, session_string):
    """Start a single bot instance for an account"""
    try:
        logger.info(f"Starting bot for account {account_id}")
        
        if isinstance(session_string, bytes):
            session_string = session_string.decode('utf-8')
            
        try:
            session = StringSession(session_string)
        except ValueError as ve:
            logger.error(f"❌ Telethon session parsing failed for account {account_id}: {ve}")
            return
            
        client = TelegramClient(session, API_ID, API_HASH, sequential_updates=True)
        
        logger.info(f"Connecting client for account {account_id}...")
        await client.connect()
        
        if not await client.is_user_authorized():
            logger.error(f"Account {account_id} NOT AUTHORIZED. Session string may be invalid or expired. Marking as expired in DB.")
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("UPDATE telegram_accounts SET session_status = 'expired' WHERE id = ?", (account_id,))
                conn.commit()
                conn.close()
            except Exception as db_err:
                logger.error(f"Failed to mark account {account_id} as expired: {db_err}")
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
                getattr(sender, 'username', None), event.chat_id, event.id,
                first_name=getattr(sender, 'first_name', None)
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
                                getattr(sender, 'username', None), m.chat_id, m.id,
                                first_name=getattr(sender, 'first_name', None)
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
                    # Skip obviously invalid sessions to prevent task churn
                    s = acc['session_string']
                    if not s or s.lower() == 'dummy_session' or len(s) < 20:
                        continue

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
        
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", default="engagement", help="Bot type: engagement or outreach")
    args = parser.parse_args()
    
    BOT_TYPE = args.type
    logger.info(f"Bot starting with type: {BOT_TYPE}")
    
    asyncio.run(main())
