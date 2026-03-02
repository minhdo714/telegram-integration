import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'workers'))
from ai_handler import AIHandler

def test_fix():
    handler = AIHandler()
    print("Testing handle_message with account 9 (which caused the crash)...")
    
    # account_id, remote_user_id, message_text
    try:
        # Note: This might still fail with other errors if DB isn't set up perfectly for test,
        # but our goal is to ensure it doesn't hit the 'NoneType' attribute error at line 142.
        result = handler.handle_message(9, 777000, "Hello")
        print("Success! Result:", result)
    except AttributeError as e:
        print(f"FAILED: Still hit AttributeError: {e}")
    except Exception as e:
        # Other exceptions are acceptable for this test as long as they are not the AttributeError on None
        print(f"Caught other exception (likely DB/Client related, but no crash at line 142): {e}")

if __name__ == "__main__":
    # Ensure we are in the workers directory context if needed, or point to it
    os.chdir('workers')
    test_fix()
