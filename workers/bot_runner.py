import asyncio
import sqlite3
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from auth_handler import DB_PATH
from ai_handler import AIHandler
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

# Configure Logging
log_file = os.path.join(os.path.dirname(__file__), 'bot.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

ai_handler = AIHandler()
clients = {} # account_id -> client

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
                sender = await event.get_sender()
                username = getattr(sender, 'username', None)
                user_id = sender.id
                message = event.message.message
                
                logger.info(f"Received message from {username} ({user_id}) on account {account_id}: {message}")
                
                # Process with AI
                response = ai_handler.handle_message(account_id, user_id, message, username)
                
                if response:
                    # Send text response
                    if response.get('text'):
                        await event.reply(response['text'])
                        
                    # Send image response if present
                    if response.get('image_path'):
                        img_path = response['image_path']
                        # Check if file exists or is URL
                        if os.path.exists(img_path) or img_path.startswith('http'):
                            await client.send_file(event.chat_id, img_path)
                        else:
                             await event.reply(f"[DEBUG] Image not found: {img_path}")

            except Exception as e:
                logger.error(f"Error handling message: {e}")

        
        clients[account_id] = client
        logger.info(f"Bot started for account {account_id}")
        
        # Keep client running? Telethon clients need to allow the event loop to run.
        # We will gather all clients in the main loop.

    except Exception as e:
        logger.error(f"Failed to start bot for account {account_id}: {e}")

async def main():
    logger.info("Starting Bot Runner...")
    
    # 1. Fetch active accounts
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, session_string FROM telegram_accounts WHERE status = 'active' AND session_status = 'active'")
    accounts = c.fetchall()
    conn.close()
    
    if not accounts:
        logger.info("No active accounts found.")
        return

    # 2. Start clients
    tasks = []
    for acc in accounts:
        task = start_bot(acc['id'], acc['session_string'])
        tasks.append(task)
    
    await asyncio.gather(*tasks)
    
    logger.info("All bots started. Listening for messages...")
    
    # Keep the script running
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        logger.info("Stopping bots...")
        for client in clients.values():
            await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
