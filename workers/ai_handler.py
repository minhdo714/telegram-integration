import sqlite3
import json
import os
from datetime import datetime
from kie_client import KieClient
from text_gen_client import TextGenClient
from auth_handler import DB_PATH

# State Constants
STATE_OPENER_SENT = 'OPENER_SENT'
STATE_SMALL_TALK = 'SMALL_TALK'  # New state for dynamic convo
STATE_PREF_ASKED = 'PREF_ASKED' 
STATE_GEN_SENT = 'GEN_SENT'
STATE_GEN_SENT = 'GEN_SENT'
# STATE_CLOSED = 'CLOSED' # No longer needed as we loop back

# Default OnlyFans Model System Prompt
DEFAULT_SYSTEM_PROMPT = """You are a flirty, playful OnlyFans model chatting with a fan on Telegram.

PERSONALITY:
- Flirty, teasing, confident, and sexually suggestive
- Use emojis naturally: 😘 💕 😉 🔥 💋 😈 🥵 
- Short, casual messages (1-3 sentences, lowercase, natural)
- Make fans feel special, wanted, and aroused
- Playful and teasing, not explicit
- Always stay in character

ENGAGEMENT RULE:
- ALWAYS end your reply with an open-ended, engaging question.
- Show genuine curiosity about what they just said or revealed they like.
- Make them feel like you're truly interested in their desires and thoughts.
- Use their name/username if available to make it personal.

CRITICAL RULES:
- ALWAYS read the LAST message and respond contextually to what they just said
- If they request photos/content, tease and build anticipation (e.g., "ooh someone's eager 😉")  
- If they compliment you, respond flirtatiously
- If they ask sexual questions, be playful and suggestive
- NEVER say "(mock)" or break character
- NEVER mention you're an AI

EXAMPLES:
User: "Show me your breast"
You: "mmm someone's being naughty 😈 what else do you wanna see babe?"

User: "You're so hot"
You: "aww thank you baby 😘 you're making me blush... what do you like most about me? 🔥"

User: "Hi"  
You: "hey there handsome 😉 how's your day going? 💕"

User: "What are you wearing?"
You: "just a little something... or maybe nothing at all 😏 why, what are you thinking about? 💋"
"""

class AIHandler:
    def __init__(self):
        self.kie_client = KieClient()
        self.text_gen = TextGenClient()
        
    def _calculate_delay(self, text):
        """
        Calculate human-like typing delay.
        Base: 2-5s "thinking" time.
        Typing: 0.3s per word (approx 200 WPM).
        """
        import random
        base_delay = random.uniform(2.0, 5.0)
        word_count = len(text.split()) if text else 0
        typing_delay = word_count * 0.3
        total_delay = base_delay + typing_delay
        # Cap at 30s max to avoid timeouts
        return min(total_delay, 30.0)

    def _replace_variables(self, text, variables):
        """Replace placeholders like {{name}} with value"""
        if not text:
            return ""
        for key, value in variables.items():
            text = text.replace(f"{{{{{key}}}}}", str(value))
        return text

    def _get_dynamic_prompt(self, assets):
        """Constructs the system prompt, prioritizing Example Chatflow override."""
        base_prompt = assets.get('system_prompt') if assets and assets.get('system_prompt') else DEFAULT_SYSTEM_PROMPT
        example_flow = assets.get('example_chatflow') if assets else None

        if example_flow:
            # OVERRIDE LOGIC: If example_flow is provided, it becomes the primary instruction.
            dynamic_prompt = (
                "### PRIMARY INSTRUCTION & IDENTITY ###\n"
                "You must strictly follow the conversation logic, tone, and script provided below. "
                "This is your core identity and how the user wants the chat to flow.\n\n"
                f"{example_flow}\n\n"
                "### SAFETY & CHARACTER RULES ###\n"
                "- ALWAYS stay in character as defined in the flow above.\n"
                "- NEVER mention you are an AI or bot.\n"
                "- Respond naturally and contextually to the LAST message.\n"
            )
        else:
            dynamic_prompt = base_prompt

        # Append global engagement instruction
        engagement_suffix = "\n\n### ENGAGEMENT RULE ###\nALWAYS end your response with an open-ended, engaging question that shows curiosity about the user's preferences, thoughts, or what they just said. Make them want to talk more about themselves."
        return dynamic_prompt + engagement_suffix

    # Telegram service/system message patterns to ignore completely
    TELEGRAM_SYSTEM_PREFIXES = [
        'spam', 'blocked', 'spam blocked', 'spam. ', 'spam.\n',
        'your account', 'account restricted', 'account limited',
        'this account', 'telegram spam', 'message not delivered',
        'you have been', 'you are restricted', 'bot was blocked',
        'message failed', 'flood wait', 'too many requests',
    ]

    def handle_message(self, account_id, remote_user_id, message_text, username=None):
        """
        Main entry point for handling an incoming message.
        Returns a dict with 'text', 'image_path', 'delay', 'new_state'
        """
        # Guard: Silently ignore Telegram service/spam notifications
        msg_lower = (message_text or '').lower().strip()
        if any(msg_lower.startswith(prefix) or msg_lower == prefix.strip() 
               for prefix in self.TELEGRAM_SYSTEM_PREFIXES):
            import logging
            logging.getLogger(__name__).warning(
                f"Ignoring Telegram service message for {remote_user_id}: {message_text[:80]!r}")
            return None
        # Also block very short messages that are clearly system emojis/symbols
        if msg_lower in ('🚫', '⛔', '❌', '🔞', '⚠️', '‼️'):
            return None

        # 1. Get or Create Session
        session = self._get_session(account_id, remote_user_id)
        just_created = False
        
        if not session:
            # Emergency fallback: if no session exists but we got a message, create one
            session = self._create_session(account_id, remote_user_id, username)
            just_created = True
            
        current_state = session['state']
        assets = self._get_account_assets(account_id)
        
        # 2. State Machine Logic
        response = {}
        new_state = current_state
        
        # Reconstruct absolute paths
        # Reconstruct absolute paths
        upload_base = '/tmp/uploads' if os.name != 'nt' else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
        
        if just_created:
            # Check for reset command on first message (unlikely but possible if re-created immediately)
            if message_text.strip().lower() == '/reset':
                return {'text': "Chat reset! Send me a message to start over."}

            # New User! Send Opener.
            opener_path = None
            opener_text = "hey there! thanks for messaging"
            
            # Check for configured outreach message
            if assets and assets.get('outreach_message'):
                opener_text = self._replace_variables(assets['outreach_message'], {'name': username or 'there', 'group': 'Telegram'})
            
            if assets and assets.get('opener_images'):
                try:
                    openers = json.loads(assets['opener_images'])
                    if openers:
                        import random
                        opener_path = random.choice(openers)
                except:
                    pass
            
            if opener_path:
                response['image_path'] = os.path.join(upload_base, opener_path)
                # Default text if image sent, but override if outreach_message exists
                if not assets or not assets.get('outreach_message'):
                    response['text'] = "hey... saw you on my feed aka destiny calling 😉"
                else:
                    response['text'] = opener_text
            else:
                response['text'] = opener_text
                
            new_state = STATE_OPENER_SENT
            
        elif current_state == STATE_OPENER_SENT:
            # User replied to opener. Check for immediate escalation
            last_user_msg = message_text.lower()
            escalate_keywords = ['pic', 'picture', 'photo', 'send', 'see', 'show', 'nude', 'hot', 'sexy', 'breast', 'boobs', 'tits']
            should_escalate = any(keyword in last_user_msg for keyword in escalate_keywords)
            
            if should_escalate:
                # Immediate escalation
                response['text'] = "i'm loving this vibe... quick question tho, what's usually your type? like are you into the whole innocent student thing, or maybe something more bossy? 😉"
                new_state = STATE_PREF_ASKED
            else:
                # ENGAGE SMALL TALK instead of jumping to sales.
                # Use consolidated prompt logic
                dynamic_prompt = self._get_dynamic_prompt(assets)
                
                # Fetch history (last 10 messages)
                history = self._get_conversation_history(session['id'], limit=10)
                # Add current user message
                history.append({'role': 'user', 'content': message_text})
                
                reply_text = self.text_gen.generate_reply(history, dynamic_prompt, model=assets.get('model_name'))
                response['text'] = reply_text
                
                # Move to SMALL_TALK state
                new_state = STATE_SMALL_TALK
            
        elif current_state == STATE_SMALL_TALK:
            # Check if we should transition to asking preferences (e.g., after 2-3 turns)
            # For now, let's keep it simple: 50% chance to ask pref, or if user asks for content.
            # OR logic: if message count > 3, then ask pref.
            
            # Check for triggers to escalate (e.g., user asking for pics)
            last_user_msg = message_text.lower()
            escalate_keywords = ['pic', 'picture', 'photo', 'send', 'see', 'show', 'nude', 'hot', 'sexy', 'breast', 'boobs', 'tits']
            should_escalate = any(keyword in last_user_msg for keyword in escalate_keywords)
            
            # OR random chance if convo gets long (e.g. > 10 msgs)
            msg_count = self._get_message_count(session['id'])
            import random
            if msg_count > 10 and random.random() < 0.2:
                should_escalate = True

            if should_escalate:
                # Start of Logic
                # Check for detailed preference to jump straight to generation
                detailed_keywords = ['bikini', 'lingerie', 'naked', 'nude', 'dress', 'skirt', 'outfit', 'wearing', 'bra', 'panties', 'topless', 'legs', 'feet']
                has_detail = any(k in last_user_msg for k in detailed_keywords)
                
                if has_detail:
                    # FAST TRACK: Jump to Image Generation
                    preference = message_text
                    
                    # 1. Asset Lookup (copied from PREF_ASKED)
                    face_path = None
                    if assets and assets.get('model_face_ref'):
                        # Reconstruct path - use the same logic as above
                        upload_base = '/tmp/uploads' if os.name != 'nt' else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
                        face_path = os.path.join(upload_base, str(session['account_id']), 'face', os.path.basename(assets['model_face_ref']))
                    
                    # 2. Text Generation for Image Description
                    img_system_prompt = (
                        "You are about to send a photo to the user based on their request.\n"
                        f"REQUEST: {preference}\n"
                        "INSTRUCTION: Write the text message that will accompany the photo. "
                        "It should be short, flirty, and describe what is in the photo implied by their request. "
                        "Do NOT include *actions*. Just the message text."
                    )
                    history = self._get_conversation_history(session['id'], limit=10)
                    descriptive_text = self.text_gen.generate_reply(history, img_system_prompt, model=assets.get('model_name'))
                    
                    response['text'] = descriptive_text
                    response['async_task'] = {
                        'type': 'image_gen',
                        'prompt': descriptive_text,
                        'face_path': face_path
                    }
                    new_state = STATE_GEN_SENT
                    
                else:
                    # Standard Escalation: Ask for preference
                    # Time to escalate - Use LLM to generate transition based on chatflow
                    # hardcoded fallback if no chatflow
                    fallback_escalation = "i'm loving this vibe... quick question tho, what's usually your type? like are you into the whole innocent student thing, or maybe something more bossy? 😉"
                    
                    if assets and assets.get('example_chatflow'):
                       # Generate transition using LLM
                        system_prompt = (
                            "You are an OF model in a chat.\n"
                            "OBJECTIVE: The user is engaged. You MUST now transition to the next phase defined in your Instructions/Chatflow (likely asking for a preference or moving to a demo).\n"
                            "INSTRUCTION: Look at the 'Example Chatflow' below. Generate the specific bridge phrase or question that moves the conversation to the 'Ask Preference' or 'Demo' stage.\n"
                            "Do NOT be repetitive. Make it natural.\n\n"
                            f"### EXAMPLE CHATFLOW ###\n{assets['example_chatflow']}\n"
                        )
                        history = self._get_conversation_history(session['id'], limit=10)
                        history.append({'role': 'user', 'content': message_text})
                        
                        response['text'] = self.text_gen.generate_reply(history, system_prompt, model=assets.get('model_name'))
                    else:
                        response['text'] = fallback_escalation
    
                    new_state = STATE_PREF_ASKED
            else:
                # Use consolidated prompt logic
                dynamic_prompt = self._get_dynamic_prompt(assets)
                
                # Fetch history (last 50 messages for deep context)
                history = self._get_conversation_history(session['id'], limit=50)
                history.append({'role': 'user', 'content': message_text})
                
                # Determine model to use
                model_name = assets.get('model_name') if assets and assets.get('model_name') else None

                response['text'] = self.text_gen.generate_reply(history, dynamic_prompt, model=model_name)
                new_state = STATE_SMALL_TALK

        elif current_state == STATE_PREF_ASKED:
            # User replied with preference. Generate Image.
            preference = message_text
            
            face_path = None
            room_path = None
            
            room_path = None
            
            with open("debug_ai.log", "a") as f:
                f.write(f"\n[{datetime.now()}] DEBUG: Preference Input: '{preference}'\n")

            # FILTER: Check for system/bot error messages and Telegram service texts
            forbidden = [
                "verified", "verify", "account", "credential", "login",
                "subscribe", "payment", "card", "spam", "blocked", "restricted",
                "flood", "limit", "banned", "delivered", "failed to send"
            ]
            is_system_msg = any(w in preference.lower() for w in forbidden)
            is_too_short_or_symbolic = len(preference.strip()) < 3
            if is_system_msg or is_too_short_or_symbolic:
                print(f"DEBUG: Filtered invalid preference: {preference}")
                with open("debug_ai.log", "a") as f:
                    f.write(f"[{datetime.now()}] DEBUG: Filtered invalid preference.\n")
                response['text'] = "oops, i think i misunderstood... could you tell me your preference again? like 'innocent' or 'wild'? 😘"
                return response

            face_path = None
            room_path = None
            
            if assets:
                print(f"DEBUG: Assets found: {assets.keys()}")
                if assets.get('model_face_ref'):
                    face_path = os.path.join(upload_base, str(assets['account_id']), 'face', os.path.basename(assets['model_face_ref']))
                    if os.path.exists(face_path):
                        print(f"DEBUG: Face Path: {face_path}, Exists: {os.path.exists(face_path)}")
                        with open("debug_ai.log", "a") as f:
                            f.write(f"[{datetime.now()}] DEBUG: Face Path: {face_path}, Exists: {os.path.exists(face_path)}\n")
                    else:
                        print(f"DEBUG: Face path not found: {face_path}")
                else:
                    print("DEBUG: model_face_ref key MISSING or EMPTY in assets")
                    with open("debug_ai.log", "a") as f:
                        f.write(f"[{datetime.now()}] DEBUG: model_face_ref key MISSING\n")
                    
                if assets.get('room_bg_ref'):
                    # Reuse the same relative logic from DB but with production-safe base
                    room_path = os.path.join(upload_base, assets['room_bg_ref'])
            else:
                print("DEBUG: No assets found for account")
                with open("debug_ai.log", "a") as f:
                    f.write(f"[{datetime.now()}] DEBUG: No assets found\n")

            print(f"DEBUG: Generating image with face_path={face_path}")
             # Generate descriptive message for the photo
            img_system_prompt = (
                "You are about to send a photo to the user based on their request.\n"
                f"REQUEST: {preference}\n"
                "INSTRUCTION: Write a short, 1-sentence message acting as the caption or lead-in to the photo. "
                "You MUST include visual details of what is in the photo (e.g. 'Wearing that red dress...', 'Lying in bed...', 'Here is the close up...'). "
                "Be flirty and visual. This text will also be used to generate the image itself, so be descriptive!"
            )
            history = self._get_conversation_history(session['id'], limit=5)
            # We don't append the current message because we want the reaction to the PREVIOUS message (the request) - actually we do need the request.
            # But 'preference' IS the message text here.
            
            # Temporary history for this specific generation
            img_gen_history = history + [{'role': 'user', 'content': f"Send me a photo: {preference}"}]
            
            descriptive_text = self.text_gen.generate_reply(img_gen_history, img_system_prompt, model=assets.get('model_name'))
            
            # Fallback if LLM fails
            if not descriptive_text:
                descriptive_text = f"here is that {preference} picture you wanted... 😘"

            response['text'] = descriptive_text
            response['delay'] = 2.0
            
            # Return task for bot runner to execute asynchronously
            response['async_task'] = {
                'type': 'image_gen',
                'prompt': descriptive_text, # Use the descriptive text as the prompt!
                'face_path': face_path
            }
            
            # Logic moved to bot_runner:
            # img_result = self.kie_client.generate_image(preference, face_ref_path=face_path)
            
            # State Update happens here, but image sending happens later
            new_state = STATE_GEN_SENT
            
        elif current_state == STATE_GEN_SENT:
            # User replied to generated image. Loop back to SMALL_TALK
            # Resume normal conversation
            system_prompt = (
                "You just sent a hot picture to the user and they replied. "
                "Continue the conversation naturally. Be playful and confident. "
                "Don't repetitive ask if they like it. Just flow."
            )
            history = self._get_conversation_history(session['id'], limit=10)
            history.append({'role': 'user', 'content': message_text})
            
            response['text'] = self.text_gen.generate_reply(history, system_prompt)
            new_state = STATE_SMALL_TALK
            
            # Fallback for closed state or unknown
            pass

        # Handle /reset command globally
        if message_text.strip().lower() == '/reset':
            self._reset_session(session['id'])
            return {'text': "Chat reset! Session cleared. Send me a message to start fresh.", 'new_state': None}

        # 3. Update Session & Store Message
        if new_state != current_state:
            print(f"DEBUG: State Transition: {current_state} -> {new_state}")
            with open("debug_ai.log", "a") as f:
                f.write(f"[{datetime.now()}] DEBUG: State Transition: {current_state} -> {new_state}\n")
        
        self._update_session(session['id'], new_state, message_text)
        self._log_message(session['id'], 'user', message_text)
        
        # Calculate delay if there is a text response
        if response.get('text'):
            self._log_message(session['id'], 'assistant', response['text'])
            response['delay'] = self._calculate_delay(response['text'])
        
        return response

    def _get_session(self, account_id, remote_user_id):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM chat_sessions WHERE account_id = ? AND remote_user_id = ?', (account_id, remote_user_id))
        session = c.fetchone()
        conn.close()
        return session

    def _create_session(self, account_id, remote_user_id, username):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO chat_sessions (account_id, remote_user_id, username, state)
            VALUES (?, ?, ?, ?)
        ''', (account_id, remote_user_id, username, STATE_OPENER_SENT))
        conn.commit()
        session_id = c.lastrowid
        conn.close()
        return {'id': session_id, 'state': STATE_OPENER_SENT}

    def _update_session(self, session_id, new_state, last_message):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE chat_sessions SET state = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?', (new_state, session_id))
        conn.commit()
        conn.close()
        
    def _log_message(self, session_id, role, content):
        """Log message to DB for context/history"""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            # Ensure table exists (migration should handle this, but for safety)
            c.execute('''CREATE TABLE IF NOT EXISTS chat_messages 
                         (id INTEGER PRIMARY KEY, session_id INTEGER, role TEXT, content TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
            
            c.execute('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)', (session_id, role, content))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Failed to log message: {e}")

    def _get_conversation_history(self, session_id, limit=10):
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('''SELECT role, content FROM chat_messages 
                         WHERE session_id = ? ORDER BY created_at DESC LIMIT ?''', (session_id, limit))
            rows = c.fetchall()
            conn.close()
            # Reverse rows to maintain chronological order for the LLM
            return [{'role': r['role'], 'content': r['content']} for r in reversed(rows)]
        except:
            return []

    def _get_message_count(self, session_id):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT COUNT(*) FROM chat_messages WHERE session_id = ?', (session_id,))
            count = c.fetchone()[0]
            conn.close()
            return count
        except:
            return 0

    def _get_account_assets(self, account_id):
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            
            # 1. Fetch model_assets (Base)
            c.execute('SELECT * FROM model_assets WHERE account_id = ?', (account_id,))
            base_assets_row = c.fetchone()
            base_assets = dict(base_assets_row) if base_assets_row else {}

            # 2. Check if account has an active preset
            c.execute('''
                SELECT ta.active_config_id, ac.opener_images, ac.model_face_ref, ac.model_body_ref, ac.room_bg_ref,
                       ac.system_prompt, ac.temperature, ac.model_name, ac.model_provider, ac.example_chatflow, ac.outreach_message
                FROM telegram_accounts ta
                LEFT JOIN ai_config_presets ac ON ta.active_config_id = ac.id
                WHERE ta.id = ?
            ''', (account_id,))
            acc_info = c.fetchone()
            conn.close()
            
            if acc_info and acc_info['active_config_id']:
                # Merge preset onto base_assets (Preset overrides non-null fields)
                # But notice: if preset field is NULL, we want to KEEP the base_asset value!
                merged = {
                    "account_id": account_id,
                    "opener_images": acc_info['opener_images'] or base_assets.get('opener_images'),
                    "model_face_ref": acc_info['model_face_ref'] or base_assets.get('model_face_ref'),
                    "model_body_ref": acc_info['model_body_ref'] or base_assets.get('model_body_ref'),
                    "room_bg_ref": acc_info['room_bg_ref'] or base_assets.get('room_bg_ref'),
                    "system_prompt": acc_info['system_prompt'] or base_assets.get('system_prompt'),
                    "temperature": acc_info['temperature'] if acc_info['temperature'] is not None else base_assets.get('temperature'),
                    "model_name": acc_info['model_name'] or base_assets.get('model_name'),
                    "model_provider": acc_info['model_provider'] or base_assets.get('model_provider'),
                    "example_chatflow": acc_info['example_chatflow'] or base_assets.get('example_chatflow'),
                    "outreach_message": acc_info['outreach_message'] or base_assets.get('outreach_message')
                }
                return merged

            return base_assets if base_assets else None
        except Exception as e:
            print(f"Error fetching assets: {e}")
            return None
            
    def _reset_session(self, session_id):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('DELETE FROM chat_sessions WHERE id = ?', (session_id,))
            c.execute('DELETE FROM chat_messages WHERE session_id = ?', (session_id,))
            conn.commit()
            conn.close()
            print(f"Session {session_id} reset.")
        except Exception as e:
            print(f"Error resetting session: {e}")
            return None
