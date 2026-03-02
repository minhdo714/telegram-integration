
import os
import sys
import asyncio
from dotenv import load_dotenv

# Load env vars from .env file in current directory
load_dotenv()

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

try:
    from telethon_handler import request_sms_code
except ImportError:
    # Fallback if direct import fails
    from workers.telethon_handler import request_sms_code

# Hardcoded phone number from previous step
PHONE_NUMBER = "17143329798"

print(f"Testing SMS request for: {PHONE_NUMBER}")

# Create a new event loop for this test
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

try:
    # request_sms_code creates its own loop if not running in one, 
    # but since we import it, better checking if it's async or sync wrapper.
    # Looking at code: it defines async send_code() and runs it with loop.run_until_complete()
    # So it is a synchronous blocking function.
    print("Calling request_sms_code...")
    result = request_sms_code(PHONE_NUMBER)
    print("Result:", result)
except Exception as e:
    print(f"Error requesting SMS: {e}")
    import traceback
    traceback.print_exc()
