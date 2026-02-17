
import asyncio
import os
import sys

# Add current directory to sys.path to find local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_handler import AIHandler
from auth_handler import DB_PATH

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except:
    pass

# Force provider
os.environ['TEXT_GEN_PROVIDER'] = 'xai'

async def test_ai():
    print("--- STARTING AI LOGIC TEST ---")
    print(f"Provider: {os.environ.get('TEXT_GEN_PROVIDER')}")
    print(f"XAI_MODEL: {os.environ.get('XAI_MODEL')}")
    
    # 1. Init Handler
    try:
        handler = AIHandler()
        print("[OK] AIHandler initialized.")
    except Exception as e:
        print(f"[FAIL] AIHandler init failed: {e}")
        return

    # 2. Mock Data
    account_id = 9
    user_id = 123456789
    username = "test_user"
    message = "ping"

    print(f"--- Processing Message: '{message}' ---")

    # 3. Process
    try:
        response = handler.handle_message(account_id, user_id, message, username)
        print("\n--- AI RESPONSE ---")
        print(response)
        
        if response and response.get('text'):
             # Check if it's the error string
             if "slow" in response['text'] or "wrong" in response['text'] or "weird" in response['text']:
                 print("[FAIL] AI returned error text response.")
             else:
                 print("[PASS] AI generated valid text response.")
        else:
             print("[FAIL] AI returned empty or invalid response.")

    except Exception as e:
        print(f"[FAIL] AI Processing crashed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_ai())
