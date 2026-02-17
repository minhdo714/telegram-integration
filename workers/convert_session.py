import os
import sys
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

# Load credentials
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

def convert_to_string(session_file):
    if not API_ID or not API_HASH:
        print("Error: Please set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables.")
        return

    if not session_file.endswith('.session'):
        print(f"Error: {session_file} is not a .session file.")
        return

    session_name = session_file.replace('.session', '')
    
    try:
        # We use the session name (without .session)
        client = TelegramClient(session_name, int(API_ID), API_HASH)
        client.connect()
        
        string_session = client.session.save()
        print(f"\n--- SESSION STRING FOR {session_file} ---")
        print(string_session)
        print("-------------------------------------------\n")
        
        client.disconnect()
    except Exception as e:
        print(f"Failed to convert {session_file}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_session.py <path_to_session_file>")
    else:
        convert_to_string(sys.argv[1])
