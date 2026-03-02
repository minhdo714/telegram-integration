import os
import sqlite3
import sys
from unittest.mock import MagicMock

# Add current directory to path so we can import workers
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_handler import AIHandler, STATE_OUTREACH_PART1, STATE_OUTREACH_PART2

def test_outreach_logic():
    print("Starting Outreach Logic Verification...")
    
    # 1. Setup mock database/assets for a test account
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Ensure a test account and outreach config exist
    user_id = 999
    account_id = 999
    
    # Clean up
    c.execute("DELETE FROM telegram_accounts WHERE id = ?", (account_id,))
    c.execute("DELETE FROM outreach_configs WHERE id = 1 AND user_id = ?", (user_id,))
    c.execute("DELETE FROM chat_sessions WHERE account_id = ?", (account_id,))
    
    # Insert test data
    c.execute('''INSERT INTO outreach_configs 
                 (id, user_id, name, system_prompt, model_name, outreach_message, example_chatflow)
                 VALUES (1, ?, 'Test Outreach', 'Outreach System Prompt', 'gpt-4o', 'Hello!', 'Part 1 Flow\nPart 2 Flow')''', (user_id,))
    
    c.execute('''INSERT INTO telegram_accounts 
                 (id, user_id, phone_number, active_outreach_config_id, session_string) 
                 VALUES (?, ?, '123456789', 1, 'dummy_session')''', (account_id, user_id))
    
    conn.commit()
    conn.close()
    print("Mock data setup complete.")

    # 2. Instantiate AIHandler
    handler = AIHandler()
    
    # Mock the text generation to avoid API calls during simple logic test
    handler.text_gen = MagicMock()
    handler.text_gen.generate_reply.return_value = "Part 1 Response"

    remote_user_id = 555
    
    # Test Part 1 (Initial Message — new session created, opener sent)
    print("\nTesting Part 1 (Initial Outreach opener + state)...")
    res1 = handler.handle_message(account_id, remote_user_id, "Hey, what is this?", bot_type='outreach')
    print(f"Part 1 Result: {res1}")
    if res1 and res1.get('new_state') == STATE_OUTREACH_PART1:
        print("✅ Part 1 State Transition Success (OUTREACH_PART1)")
    else:
        print(f"❌ Part 1 State Transition Failed — got: {res1.get('new_state') if res1 else None}")

    # Test Part 1 reply — prospect sends another message while in OUTREACH_PART1
    print("\nTesting OUTREACH_PART1 reply (prospect responded)...")
    handler.text_gen.generate_reply.return_value = "Following the script response"
    res1b = handler.handle_message(account_id, remote_user_id, "Sure, tell me more", bot_type='outreach')
    print(f"OUTREACH_PART1 reply Result: {res1b}")
    if res1b and res1b.get('new_state') == STATE_OUTREACH_PART1:
        print("✅ OUTREACH_PART1 reply stays in OUTREACH_PART1")
    else:
        print(f"❌ OUTREACH_PART1 reply failed — got: {res1b.get('new_state') if res1b else None}")

    # Test Triggering Part 2
    print("\nTesting Part 2 Trigger ('START')...")
    handler.text_gen.generate_reply.return_value = "Part 2 Response (Model Imitation)"
    res2 = handler.handle_message(account_id, remote_user_id, "START", bot_type='outreach')
    print(f"Part 2 Result: {res2}")
    if res2 and res2.get('new_state') == STATE_OUTREACH_PART2:
        print("✅ Part 2 State Transition Success")
    else:
        print(f"❌ Part 2 State Transition Failed — got: {res2.get('new_state') if res2 else None}")

    # Test misspelling of START
    print("\nTesting Part 2 Trigger misspelling ('STARR')...")
    res3 = handler.handle_message(account_id, remote_user_id, "STARR", bot_type='outreach')
    if res3 and res3.get('new_state') == STATE_OUTREACH_PART2:
        print("✅ Misspelling Trigger Success")
    else:
        print(f"❌ Misspelling Trigger Failed — got: {res3.get('new_state') if res3 else None}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    test_outreach_logic()
