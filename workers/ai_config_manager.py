
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')

def get_ai_configs(user_id):
    """Get all AI config presets for a user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute('SELECT * FROM ai_config_presets WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        configs = [dict(row) for row in c.fetchall()]
        
        conn.close()
        return {'status': 'success', 'configs': configs}
    except Exception as e:
        return {'error': str(e)}

def save_ai_config(user_id, name, system_prompt, model_provider, model_name, temperature, 
                   opener_images=None, model_face_ref=None, model_body_ref=None, room_bg_ref=None,
                   outreach_message=None, example_chatflow=None, blast_list=None,
                   account_id=None, config_id=None):
    """Create or Update an AI config preset and optionally set it as active for an account"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        final_id = config_id
        if config_id:
            # Update
            c.execute('''UPDATE ai_config_presets SET 
                         name = ?, system_prompt = ?, model_provider = ?, model_name = ?, temperature = ?,
                         opener_images = ?, model_face_ref = ?, model_body_ref = ?, room_bg_ref = ?,
                         outreach_message = ?, example_chatflow = ?, blast_list = ?
                         WHERE id = ? AND user_id = ?''',
                      (name, system_prompt, model_provider, model_name, temperature, 
                       opener_images, model_face_ref, model_body_ref, room_bg_ref,
                       outreach_message, example_chatflow, blast_list,
                       config_id, user_id))
        else:
            # Insert
            c.execute('''INSERT INTO ai_config_presets 
                         (user_id, name, system_prompt, model_provider, model_name, temperature,
                          opener_images, model_face_ref, model_body_ref, room_bg_ref,
                          outreach_message, example_chatflow, blast_list)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (user_id, name, system_prompt, model_provider, model_name, temperature,
                       opener_images, model_face_ref, model_body_ref, room_bg_ref,
                       outreach_message, example_chatflow, blast_list))
            final_id = c.lastrowid
            
        # If account_id is provided, set this as the active config for engagement
        if account_id:
            c.execute('UPDATE telegram_accounts SET active_config_id = ? WHERE id = ? AND user_id = ?',
                      (final_id, account_id, user_id))
            
        conn.commit()
        conn.close()
        return {'status': 'success', 'id': final_id}
    except Exception as e:
        return {'error': str(e)}

def delete_ai_config(config_id, user_id):
    """Delete an AI config preset"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Optional: Check if used by any account and warn/block? 
        # For now, just set active_config_id to NULL for those accounts
        c.execute('UPDATE telegram_accounts SET active_config_id = NULL WHERE active_config_id = ? AND user_id = ?', (config_id, user_id))
        
        c.execute('DELETE FROM ai_config_presets WHERE id = ? AND user_id = ?', (config_id, user_id))
        conn.commit()
        conn.close()
        return {'status': 'success'}
    except Exception as e:
        return {'error': str(e)}

def get_outreach_configs(user_id):
    """Get all outreach config presets for a user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute('SELECT * FROM outreach_configs WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        configs = [dict(row) for row in c.fetchall()]
        
        conn.close()
        return {'status': 'success', 'configs': configs}
    except Exception as e:
        return {'error': str(e)}

def save_outreach_config(user_id, name, system_prompt, model_provider, model_name, temperature, 
                         opener_images=None, model_face_ref=None, model_body_ref=None, room_bg_ref=None,
                         outreach_message=None, example_chatflow=None, part3_chatflow=None, blast_list=None,
                         account_id=None, config_id=None):
    """Create or Update an outreach config preset and optionally set it as active for an account"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        final_id = config_id
        if config_id:
            # Update
            c.execute('''UPDATE outreach_configs SET 
                         name = ?, system_prompt = ?, model_provider = ?, model_name = ?, temperature = ?,
                         opener_images = ?, model_face_ref = ?, model_body_ref = ?, room_bg_ref = ?,
                         outreach_message = ?, example_chatflow = ?, part3_chatflow = ?, blast_list = ?
                         WHERE id = ? AND user_id = ?''',
                      (name, system_prompt, model_provider, model_name, temperature, 
                       opener_images, model_face_ref, model_body_ref, room_bg_ref,
                       outreach_message, example_chatflow, part3_chatflow, blast_list,
                       config_id, user_id))
        else:
            # Insert
            c.execute('''INSERT INTO outreach_configs 
                         (user_id, name, system_prompt, model_provider, model_name, temperature,
                          opener_images, model_face_ref, model_body_ref, room_bg_ref,
                          outreach_message, example_chatflow, part3_chatflow, blast_list)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (user_id, name, system_prompt, model_provider, model_name, temperature,
                       opener_images, model_face_ref, model_body_ref, room_bg_ref,
                       outreach_message, example_chatflow, part3_chatflow, blast_list))
            final_id = c.lastrowid
            
        # If account_id is provided, set this as the active outreach config
        if account_id:
            c.execute('UPDATE telegram_accounts SET active_outreach_config_id = ? WHERE id = ? AND user_id = ?',
                      (final_id, account_id, user_id))
            
        conn.commit()
        conn.close()
        return {'status': 'success', 'id': final_id}
    except Exception as e:
        return {'error': str(e)}

def delete_outreach_config(config_id, user_id):
    """Delete an outreach config preset"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Set active_outreach_config_id to NULL for accounts using this config
        c.execute('UPDATE telegram_accounts SET active_outreach_config_id = NULL WHERE active_outreach_config_id = ? AND user_id = ?', (config_id, user_id))
        
        c.execute('DELETE FROM outreach_configs WHERE id = ? AND user_id = ?', (config_id, user_id))
        conn.commit()
        conn.close()
        return {'status': 'success'}
    except Exception as e:
        return {'error': str(e)}
