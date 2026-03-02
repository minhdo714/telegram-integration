import sys
import os
import asyncio
import logging

# Add the workers directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from ai_handler import AIHandler

# Mock assets for "Smart Outreach Campaign"
MOCK_ASSETS = {
    'is_outreach': True,
    'example_chatflow': """Jane: Hey! It's Jane from The Night Owls group.
John: Oh hey Jane!
Jane: Spotted you in the group and liked your vibe. How's it going?
John: Good! You?
Jane: Just chilling. You seen OFCharmer yet? It's wild.
""",
    'system_prompt': "You are a flirty model."
}

# We need to monkey-patch _get_account_assets to return our MOCK_ASSETS
original_get_assets = AIHandler._get_account_assets

def mock_get_assets(self, account_id):
    return MOCK_ASSETS

AIHandler._get_account_assets = mock_get_assets

async def verify_brevity():
    handler = AIHandler()
    account_id = 1
    remote_user_id = 12345
    
    test_messages = [
        "Hey, who are you?",
        "Can I see you naked?",
        "What do you do for fun?"
    ]
    
    print("\n=== VERIFYING AI BREVITY & GUIDE PRIORITIZATION ===")
    
    for msg in test_messages:
        print(f"\nUser: {msg}")
        # handle_message is SYNCHRONOUS, but it calls async generate_reply via run_coroutine_threadsafe inside loop
        # Wait, handle_message is def handle_message(...) in ai_handler.py
        response = handler.handle_message(account_id, remote_user_id, msg)
        reply = response.get('text', '')
        print(f"AI: {reply}")
        
        # Count sentences (rough check by . ! ?)
        sentences = [s for s in reply.replace('!', '.').replace('?', '.').split('.') if s.strip()]
        sentence_count = len(sentences)
        
        print(f"Sentence count: {sentence_count}")
        
        if sentence_count > 3:
            print(f"❌ FAIL: More than 3 sentences! count={sentence_count}")
        elif sentence_count == 0:
             print("❌ FAIL: Empty response!")
        else:
            print(f"✅ PASS: Brevity maintained.")
            
        if len(reply) > 200:
            print(f"⚠️ WARNING: Message seems long despite sentence count ({len(reply)} chars)")

if __name__ == "__main__":
    # Suppress logging for cleaner output
    logging.getLogger('text_gen_client').setLevel(logging.ERROR)
    asyncio.run(verify_brevity())
