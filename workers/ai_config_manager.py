
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))
DB_PATH = os.getenv('DB_PATH', 'users.db')

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

def save_ai_config(user_id, name, system_prompt, model_provider, model_name, temperature, config_id=None):
    """Create or Update an AI config preset"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        if config_id:
            # Update
            c.execute('''UPDATE ai_config_presets SET 
                         name = ?, system_prompt = ?, model_provider = ?, model_name = ?, temperature = ?
                         WHERE id = ? AND user_id = ?''',
                      (name, system_prompt, model_provider, model_name, temperature, config_id, user_id))
        else:
            # Insert
            c.execute('''INSERT INTO ai_config_presets 
                         (user_id, name, system_prompt, model_provider, model_name, temperature)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                      (user_id, name, system_prompt, model_provider, model_name, temperature))
            new_id = c.lastrowid
            
        conn.commit()
        conn.close()
        return {'status': 'success', 'id': config_id if config_id else new_id}
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
