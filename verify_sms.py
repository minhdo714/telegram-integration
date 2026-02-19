
import os
import sys
import asyncio
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

try:
    from telethon_handler import verify_sms_code
except ImportError:
    from workers.telethon_handler import verify_sms_code

# Data from previous step
PHONE_NUMBER = "17143329798"
PHONE_CODE_HASH = "28fa2f99a616b0288c" 
CODE = "21823"
SESSION_STRING = "1BVtsOKEBuzaJcTDpmQS2e0EGM_byvj7INgYV3HTpmQS2e0EGM_byvj7INgYV3HTpmQS2e0EGM_byvj7INgYV3HT..." # Truncated for brevity, but actually we need the one printed earlier

# Wait, we need the session string from the previous request to maintain context!
# The log showed: 'sessionString': '1BVtsOKEBuzaJcTDpmQS2e0EGM_byvj7INgY...'
# I'll try to use a fresh session first since copying the whole string from log might be hard/truncated.
# verify_sms_code handles session_string=None by creating a new client.

print(f"Verifying code {CODE} for {PHONE_NUMBER}...")

# Create loop
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

try:
    # We pass None for session_string hoping it works without the initial request context
    # (Sometimes it works if hash is valid, sometimes it fails)
    result = verify_sms_code(PHONE_NUMBER, CODE, PHONE_CODE_HASH, session_string=None)
    print("Result:", result)
except Exception as e:
    print(f"Error verifying: {e}")
    import traceback
    traceback.print_exc()
