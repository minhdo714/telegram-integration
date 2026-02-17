import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'workers'))
import sqlite3
import json
from workers.ai_handler import AIHandler

# Mock assets
assets = {
    'model_name': 'mock_model',
    'model_face_ref': 'face.jpg',
    'account_id': 9
}

# Mock session
session = {
    'id': 999,
    'account_id': 9,
    'state': 'SMALL_TALK',
    'history': json.dumps([])
}

def mock_get_msg_count(sid):
    return 5

def mock_get_history(sid, limit=10):
    return []

def mock_gen_reply(history, system, model=None):
    return "Sure, here is a pic!"

# Mock methods attached to instance
def mock_get_session(aid, uid):
    return session

def mock_get_assets(aid):
    return assets

def mock_log(sid, role, content):
    print(f"MOCK LOG: {role} - {content}")

# Patch handler
handler = AIHandler()
handler._get_message_count = mock_get_msg_count
handler._get_conversation_history = mock_get_history
handler.text_gen.generate_reply = mock_gen_reply 
handler._get_session = mock_get_session
handler._get_account_assets = mock_get_assets
handler._log_message = mock_log

# Test
print("Testing 'Send a pic of you in a bikini'...")
# Signature: handle_message(self, account_id, remote_user_id, message_text, username=None)
response = handler.handle_message(
    9, 
    8154274020,
    "Send a pic of you in a bikini", 
    "test_user"
)

print(f"Response: {response}")

if response.get('async_task') and response['async_task']['type'] == 'image_gen':
    print("SUCCESS: Image task generated!")
else:
    print("FAILURE: No image task.")
