
import sys
import os

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from ai_handler import AIHandler

def test_engagement():
    handler = AIHandler()
    
    # Simulate a user message that should trigger AI text generation
    account_id = 9
    user_id = 123456789
    username = "test_user"
    
    messages = [
        "hey how are you?",
        "I really like it when you wear red",
        "tell me about your day"
    ]
    
    print("\n--- AI ENGAGEMENT TEST ---")
    
    for msg in messages:
        print(f"\nUSER: {msg}")
        # We use a try-except to handle potential mock mode or API errors
        try:
            resp = handler.handle_message(account_id, user_id, msg, username)
            text = resp.get('text', '')
            print(f"AI: {text}")
            
            if '?' in text:
                print("✅ Found question mark - likely engaging.")
            else:
                print("❌ No question mark found - check rules.")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_engagement()
