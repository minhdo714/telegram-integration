import sqlite3
import json
import os
from datetime import datetime
from kie_client import KieClient
from auth_handler import DB_PATH

# State Constants
STATE_OPENER_SENT = 'OPENER_SENT'
STATE_FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED' # They replied to opener
STATE_PREF_ASKED = 'PREF_ASKED' # We sent Follow-up + Question
STATE_PREF_RECEIVED = 'PREF_RECEIVED' # They answered preference
STATE_GEN_SENT = 'GEN_SENT' # We sent generated image
STATE_CLOSED = 'CLOSED'

class AIHandler:
    def __init__(self):
        self.kie_client = KieClient()
        
    def handle_message(self, account_id, remote_user_id, message_text, username=None):
        """
        Main entry point for handling an incoming message.
        Returns a dict with 'text', 'image_path', 'new_state'
        """
        
        # 1. Get or Create Session
        session = self._get_session(account_id, remote_user_id)
        just_created = False
        
        if not session:
            session = self._create_session(account_id, remote_user_id, username)
            just_created = True
            
        current_state = session['state']
        assets = self._get_account_assets(account_id)
        
        # 2. State Machine Logic
        response = {}
        new_state = current_state
        
        # Reconstruct absolute paths
        upload_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
        
        if just_created:
            # New User! Send Opener.
            # 1. Pick random opener
            opener_path = None
            if assets and assets.get('opener_images'):
                try:
                    openers = json.loads(assets['opener_images'])
                    if openers:
                        import random
                        opener_path = random.choice(openers)
                except:
                    pass
            
            # 2. Construct Response
            if opener_path:
                # opener_path is relative like '6/opener/timestamp.jpg' -> Add absolute prefix for Telethon
                response['image_path'] = os.path.join(upload_base, opener_path)
                response['text'] = "hey... saw you on my feed aka destiny calling 😉"
            else:
                response['text'] = "hey there! thanks for messaging"
                
            # State remains STATE_OPENER_SENT, waiting for their reply
            new_state = STATE_OPENER_SENT
            
        elif current_state == STATE_OPENER_SENT:
            # User replied to opener. Send Follow-up + Ask Prefs
            response['text'] = "thank youuu 😊\nokay here’s another one i was nervous about...\n\nQuick — what would make this even hotter for you? Red lingerie? From behind? Something specific?"
            
            # Try to pick a random unused opener as fallback/followup if available
            # For now, keep placeholder or reuse logic
            # response['image_path'] = "assets/followup_default.jpg" 
            new_state = STATE_PREF_ASKED
            
        elif current_state == STATE_PREF_ASKED:
            # User replied with preference. Generate Image.
            preference = message_text
            
            # Prepare paths
            face_path = None
            room_path = None
            
            if assets:
                if assets.get('model_face_ref'):
                    face_path = os.path.join(upload_base, assets['model_face_ref'])
                if assets.get('room_bg_ref'):
                    room_path = os.path.join(upload_base, assets['room_bg_ref'])

            # Generate Image
            # Pass absolute paths to KieClient
            gen_result = self.kie_client.generate_image(
                prompt=f"A beautiful woman, {preference}",
                face_ref_path=face_path,
                body_ref_path=room_path # Using room as body_ref/base for now
            )
            
            if 'error' in gen_result:
                response['text'] = "hold on... my camera is acting up (generation failed)"
                print(f"Gen Error: {gen_result['error']}")
            else:
                response['text'] = "hold on… i just tried your idea super quick"
                # response['image_path'] = gen_result.get('url') 
                # For MVP, if returning URL, we might need to proxy it or just send it if public
                # If Kie returns a hosted URL, we use it.
                response['image_path'] = gen_result.get('url') 
                
            new_state = STATE_GEN_SENT
            
        elif current_state == STATE_GEN_SENT:
            # User replied to generated image. Close.
            response['text'] = "i’m literally having way too much fun with your feedback lol... check my bio for more 😉"
            new_state = STATE_CLOSED
            
        else:
            # Fallback
            pass

        # 3. Update Session
        self._update_session(session['id'], new_state, message_text)
        
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
        # Append to history would go here
        c.execute('UPDATE chat_sessions SET state = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?', (new_state, session_id))
        conn.commit()
        conn.close()

    def _get_account_assets(self, account_id):
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT * FROM model_assets WHERE account_id = ?', (account_id,))
            assets = c.fetchone()
            conn.close()
            return dict(assets) if assets else None
        except Exception as e:
            print(f"Error fetching assets: {e}")
            return None
