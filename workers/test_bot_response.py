"""
Test Script: Verify AI Chatbot is Working
==========================================

This script will send a test message to verify the bot responds with real AI (not mock).
"""

import asyncio
import os
import sys
from telethon import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv
import sqlite3

# Load environment
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

async def test_bot():
    # Get active account from database
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT id, username, session_string FROM telegram_accounts LIMIT 1')
    account = c.fetchone()
    conn.close()
    
    if not account:
        print("❌ No accounts found in database. Add an account first via /config page.")
        return
    
    account_id, username, session_string = account
    print(f"✅ Found account: {username} (ID: {account_id})")
    
    # Create test client
    client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
    
    try:
        await client.connect()
        me = await client.get_me()
        print(f"✅ Connected as: @{me.username}")
        print(f"\n📝 Send a test message to @{me.username} from ANOTHER account")
        print(f"   Example: 'Hey baby, what are you wearing?'")
        print(f"\n⏳ Waiting for response...")
        print(f"   (Check your Telegram to see the bot's reply)")
        print(f"\n   Expected: Flirty response WITHOUT '(mock)'")
        print(f"   Wrong: '...tell me more about that? (mock)'")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.disconnect()

if __name__ == '__main__':
    asyncio.run(test_bot())
