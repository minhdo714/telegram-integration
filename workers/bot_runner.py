import os
import logging
import sys

# Configure Logging IMMEDIATELY
# Use absolute path for log file to avoid CWD issues
log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, 'bot.log')

print(f"DEBUG: Logging to {log_file}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout) # Explicitly log to stdout for worker.py capture
    ]
)
logger = logging.getLogger(__name__)

logger.info("Bot Runner starting...")

try:
    import asyncio
    import sqlite3
    from dotenv import load_dotenv
    
    logger.info("Importing Telethon...")
    from telethon import TelegramClient, events
    from telethon.sessions import StringSession
    
    logger.info("Importing Handlers...")
    # Add current dir to path to find local modules
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from auth_handler import DB_PATH
    from ai_handler import AIHandler

    # Load environment variables
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))
    
    API_ID = os.getenv('TELEGRAM_API_ID')
    API_HASH = os.getenv('TELEGRAM_API_HASH')

    ai_handler = AIHandler()
    clients = {} # account_id -> client

except Exception as e:
    logger.critical(f"Failed to import dependencies: {e}")
    sys.exit(1)

async def start_bot(account_id, session_string):
    """Start a single bot instance for an account"""
    try:
        logger.info(f"Starting bot for account {account_id}")
        logger.info(f"API_ID present: {bool(API_ID)}")
        
        # Ensure session_string is string
        if isinstance(session_string, bytes):
            logger.info("Converting session_string from bytes to string")
            session_string = session_string.decode('utf-8')
            
        logger.info(f"Session string length: {len(session_string)}")
        
        client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
        await client.connect()
        
        is_auth = await client.is_user_authorized()
        logger.info(f"Account {account_id} is_verified: {is_auth}")
        
        if not is_auth:
            logger.warning(f"Account {account_id} not authorized. Skipping.")
            return

        @client.on(events.NewMessage(incoming=True))
        async def handler(event):
            try:
                if not event.is_private:
                    return # Ignore group/channel messages

                sender = await event.get_sender()
                username = getattr(sender, 'username', None)
                user_id = sender.id
                message = event.message.message
                
                logger.info(f"Received message from {username} ({user_id}) on account {account_id}: {message}")
                
                # Process with AI - with guaranteed response
                try:
                    response = ai_handler.handle_message(account_id, user_id, message, username)
                    
                    # Ensure we always have a valid response
                    if not response or not isinstance(response, dict):
                        logger.warning(f"AI handler returned invalid response: {response}. Using fallback.")
                        response = {'text': "hey sorry, what was that? my phone's acting weird 😅"}
                    
                    # Ensure there's at least some response
                    if not response.get('text') and not response.get('image_path') and not response.get('async_task'):
                        logger.warning("AI handler returned empty response. Using fallback.")
                        response['text'] = "hey! sorry i was spacing out... what's up? 😊"
                        
                except Exception as ai_error:
                    logger.error(f"AI handler crashed: {ai_error}", exc_info=True)
                    response = {'text': "omg sorry, my phone totally glitched... what did you say? 😅"}
                
                if response:
                    # Handle typing delay
                    delay = response.get('delay', 0)
                    if delay > 0 and response.get('text'):
                        logger.info(f"Simulating typing for {delay:.2f}s...")
                        async with client.action(event.chat_id, 'typing'):
                            await asyncio.sleep(delay)

                    # Send text response
                    if response.get('text'):
                        try:
                            await event.reply(response['text'])
                            logger.info(f"[OK] Sent text reply: {response['text'][:50]}...")
                        except Exception as send_error:
                            logger.error(f"Failed to send text reply: {send_error}", exc_info=True)
                        
                    # Handle Async Tasks (Image Generation)
                    if response.get('async_task'):
                        task = response['async_task']
                        if task['type'] == 'image_gen':
                            logger.info(f"Starting async image generation for prompt: {task['prompt']}")
                            logger.info(f"Face path provided: {task.get('face_path')}")
                            
                            try:
                                # Run blocking generation in thread
                                gen_result = await asyncio.to_thread(
                                    ai_handler.kie_client.generate_image, 
                                    task['prompt'], 
                                    face_ref_path=task.get('face_path')
                                )
                                
                                logger.info(f"Generation completed. Result: {gen_result}")
                                
                                if gen_result.get('url'):
                                    logger.info(f"Image generated successfully: {gen_result['url']}")
                                    try:
                                        logger.info(f"Attempting to send image to chat {event.chat_id}")
                                        await client.send_file(event.chat_id, gen_result['url'], caption="here u go 😘")
                                        logger.info(f"[OK] Image sent successfully!")
                                    except Exception as e:
                                        logger.error(f"Failed to send image file: {e}", exc_info=True)
                                        await event.reply(f"hmm i can't send the file directly, but here's the link: {gen_result['url']}")
                                else:
                                    logger.error(f"Image generation failed: {gen_result.get('error')}")
                                    await event.reply("ugh, my camera glitching... sorry 😭")
                            except Exception as gen_error:
                                logger.error(f"Exception during async image generation: {gen_error}", exc_info=True)
                                await event.reply("ugh, my camera glitching... sorry 😭")

                    # Send image response (Legacy/Sync)
                    if response.get('image_path'):
                        img_path = response['image_path']
                        # Check if file exists or is URL
                        if os.path.exists(img_path) or img_path.startswith('http'):
                            # Send 'uploading photo' action
                            try:
                                async with client.action(event.chat_id, 'photo'):
                                    await client.send_file(event.chat_id, img_path)
                                logger.info(f"[OK] Sent image: {img_path}")
                            except Exception as img_error:
                                logger.error(f"Failed to send image: {img_error}", exc_info=True)
                        else:
                             logger.warning(f"Image not found: {img_path}")

            except Exception as e:
                logger.error(f"Error handling message: {e}", exc_info=True)
                # Send a fallback response even if everything fails
                try:
                    await event.reply("hey sorry, something went weird on my end... what were you saying? 😅")
                except:
                    logger.error("Failed to send even the fallback response!", exc_info=True)

        
        clients[account_id] = client
        logger.info(f"Bot started for account {account_id}")
        
        # Keep client running? Telethon clients need to allow the event loop to run.
        # We will gather all clients in the main loop.

    except Exception as e:
        logger.error(f"Failed to start bot for account {account_id}: {e}")

async def main():
    logger.info("Starting Bot Runner with Dynamic Monitoring...")
    
    # Track running tasks and clients
    # running_tasks: account_id -> asyncio.Task
    running_tasks = {} 
    
    try:
        while True:
            try:
                # 1. Fetch active accounts
                conn = sqlite3.connect(DB_PATH)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                c.execute("SELECT id, session_string FROM telegram_accounts WHERE status = 'active' AND session_status = 'active'")
                accounts = c.fetchall()
                conn.close()
                
                active_account_ids = {row['id'] for row in accounts}
                current_running_ids = set(running_tasks.keys())
                
                # 2. Start new accounts
                for row in accounts:
                    acc_id = row['id']
                    if acc_id not in running_tasks:
                        logger.info(f"Found new active account {acc_id}. Starting bot...")
                        # Create a task for this bot
                        task = asyncio.create_task(start_bot(acc_id, row['session_string']))
                        running_tasks[acc_id] = task
                        
                        # Add a callback to handle task completion/failure (optional but good for cleanup)
                        def task_done_callback(t, aid=acc_id):
                            if aid in running_tasks:
                                logger.warning(f"Bot task for account {aid} exited.")
                                # We don't remove it from running_tasks immediately to avoid flapping,
                                # but the next loop logic could handle restart if needed.
                        task.add_done_callback(task_done_callback)

                # 3. Stop removed/inactive accounts
                for acc_id in current_running_ids:
                    if acc_id not in active_account_ids:
                        logger.info(f"Account {acc_id} is no longer active. Stopping bot...")
                        
                        # Cancel the task
                        task = running_tasks[acc_id]
                        task.cancel()
                        
                        # Disconnect client if exists
                        if acc_id in clients:
                            await clients[acc_id].disconnect()
                            del clients[acc_id]
                            
                        del running_tasks[acc_id]

            except Exception as e:
                logger.error(f"Error in monitor loop: {e}")
            
            # Wait before next check
            await asyncio.sleep(10)

    except asyncio.CancelledError:
        logger.info("Main loop cancelled. Shutting down...")
    except Exception as e:
        logger.critical(f"FATAL: Bot runner crashed: {e}", exc_info=True)
    finally:
        # Cleanup
        logger.info("Stopping all bots...")
        for task in running_tasks.values():
            task.cancel()
        
        for client in clients.values():
            if client.is_connected():
                await client.disconnect()

if __name__ == "__main__":
    try:
        if sys.platform == 'win32':
             asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        logger.critical(f"FATAL: Bot runner crashed: {e}", exc_info=True)
        print(f"FATAL: Bot runner crashed: {e}", file=sys.stderr)
        sys.exit(1)
