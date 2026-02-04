
from telethon import TelegramClient
from telethon.sessions import MemorySession
import io
import os
import asyncio

API_ID = int(os.getenv('TELEGRAM_API_ID', '12345'))
API_HASH = os.getenv('TELEGRAM_API_HASH', 'test')

async def test_io_session():
    print("Testing io.BytesIO() session...")
    try:
        # This is what the current code does
        client = TelegramClient(io.BytesIO(), API_ID, API_HASH)
        await client.connect()
        print("Success: io.BytesIO() worked")
        await client.disconnect()
    except Exception as e:
        print(f"Failed: io.BytesIO() caused error: {e}")

async def test_memory_session():
    print("Testing MemorySession()...")
    try:
        # This is the correct way
        client = TelegramClient(MemorySession(), API_ID, API_HASH)
        await client.connect()
        print("Success: MemorySession() worked")
        await client.disconnect()
    except Exception as e:
        print(f"Failed: MemorySession() caused error: {e}")

async def main():
    # await test_io_session()
    await test_memory_session()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(main())
