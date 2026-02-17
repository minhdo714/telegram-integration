import sys
import os
import sqlite3
import json

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from ai_handler import AIHandler

def setup_mock_data():
    """Ensure account 9 has the necessary assets for testing"""
    db_path = os.path.join('workers', 'users.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 1. Ensure account exists or use existing
    # We assume account 9 exists based on previous logs. 
    # Let's check config.
    
    # Update outreach_message and example_chatflow for testing
    chatflow = """
    1. Greeting
    2. DEMO PHASE: Ask the user to give a specific photo request (e.g. "red dress").
    3. DELIVER: Send the photo.
    """
    
    outreach = "Hi {{name}}! Welcome to the automated demo."
    
    # We need to know which active_config_id account 9 uses.
    c.execute("SELECT active_config_id FROM telegram_accounts WHERE id = 9")
    row = c.fetchone()
    if not row or not row[0]:
        print("Account 9 has no active config? Creating temp config...")
        # Create temp config
        c.execute("""
            INSERT INTO ai_config_presets (user_id, name, example_chatflow, outreach_message)
            VALUES (1, 'Test Config', ?, ?)
        """, (chatflow, outreach))
        config_id = c.lastrowid
        c.execute("UPDATE telegram_accounts SET active_config_id = ? WHERE id = 9", (config_id,))
        conn.commit()
    else:
        config_id = row[0]
        # Update existing config
        c.execute("""
            UPDATE ai_config_presets 
            SET example_chatflow = ?, outreach_message = ?
            WHERE id = ?
        """, (chatflow, outreach, config_id))
        conn.commit()
        
    conn.close()
    print("Mock data setup complete.")

def test_logic():
    handler = AIHandler()
    
    # 1. Reset Session
    print("\n--- TEST 1: RESET ---")
    handler.handle_message(9, 99999, "/reset")
    
    # 2. Trigger Opener
    print("\n--- TEST 2: NEW USER (Hi) ---")
    resp = handler.handle_message(9, 99999, "hi", username="TestUser")
    print(f"RESPONSE: {resp.get('text')}")
    
    # Verify Opener
    expected = "Hi TestUser! Welcome to the automated demo."
    if resp.get('text') == expected:
        print("✅ OPENER PASSED")
    else:
        print(f"❌ OPENER FAILED. Got: {resp.get('text')}")

    # 3. Trigger Small Talk (Transition from Opener)
    print("\n--- TEST 3: SMALL TALK ---")
    resp = handler.handle_message(9, 99999, "doing good thanks")
    print(f"RESPONSE: {resp.get('text')}")
    
    # 4. Trigger Escalation (Ask for pic)
    print("\n--- TEST 4: TRIGGER ESCALATION ---")
    resp = handler.handle_message(9, 99999, "can I see a pic?")
    print(f"RESPONSE: {resp.get('text')}")
    
    # 5. Provide Preference (Trigger Image Gen)
    print("\n--- TEST 5: PROVIDE PREFERENCE (red dress) ---")
    resp = handler.handle_message(9, 99999, "red dress")
    print(f"RESPONSE TEXT: {resp.get('text')}")
    
    if resp.get('async_task'):
        task = resp['async_task']
        print(f"ASYNC TASK: {task}")
        if task.get('prompt') == resp.get('text') and task.get('prompt') != "red dress":
             print("✅ PROMPT MATCHES TEXT (Descriptive)")
        else:
             print(f"❌ PROMPT MISMATCH or NOT DESCRIPTIVE. Prompt: {task.get('prompt')}")
    else:
        print("❌ NO ASYNC TASK returned")

if __name__ == "__main__":
    try:
        setup_mock_data()
        test_logic()
    except Exception as e:
        print(f"Test failed with error: {e}")
