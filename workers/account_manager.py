import sqlite3
from auth_handler import DB_PATH

def add_account(user_id, phone_number, session_string, telegram_user_id=None, telegram_username=None, 
                first_name=None, last_name=None, account_ownership='user_owned', session_status='active'):
    """Link a new Telegram account to a user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Check if already exists for this user
        c.execute('SELECT id FROM telegram_accounts WHERE user_id = ? AND phone_number = ?', (user_id, phone_number))
        if c.fetchone():
            # Update all fields if re-connecting
            c.execute('''UPDATE telegram_accounts SET 
                         session_string = ?, 
                         telegram_user_id = ?,
                         telegram_username = ?,
                         first_name = ?,
                         last_name = ?,
                         account_ownership = ?,
                         session_status = ?
                         WHERE user_id = ? AND phone_number = ?''', 
                      (session_string, telegram_user_id, telegram_username, first_name, last_name, 
                       account_ownership, session_status, user_id, phone_number))
        else:
            c.execute('''INSERT INTO telegram_accounts 
                         (user_id, phone_number, session_string, telegram_user_id, telegram_username,
                          first_name, last_name, account_ownership, session_status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (user_id, phone_number, session_string, telegram_user_id, telegram_username,
                       first_name, last_name, account_ownership, session_status))
            
        conn.commit()
        conn.close()
        return {'status': 'success'}
    except Exception as e:
        return {'error': str(e)}

def get_user_accounts(user_id):
    """Get all accounts for a user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute('''SELECT id, phone_number, telegram_user_id, telegram_username, first_name, last_name,
                     account_ownership, session_status, status, created_at 
                     FROM telegram_accounts WHERE user_id = ? ORDER BY created_at DESC''', (user_id,))
        
        accounts = []
        for row in c.fetchall():
            account = {
                'id': row['id'],
                'phoneNumber': row['phone_number'],
                'telegramUserId': row['telegram_user_id'],
                'telegramUsername': row['telegram_username'] or 'unknown',
                'firstName': row['first_name'],
                'lastName': row['last_name'],
                'accountOwnership': row['account_ownership'] or 'user_owned',
                'sessionStatus': row['session_status'] or row['status'] or 'idle',
                'integratedAt': row['created_at'],
                # Default values for optional fields
                'dailyDmQuota': None,
                'dailyDmSentToday': 0,
                'sessionLastValidated': None
            }
            accounts.append(account)
            
        conn.close()
        
        return {'status': 'success', 'accounts': accounts}
    except Exception as e:
        return {'error': str(e)}

def delete_account(account_id, user_id):
    """Delete an account if it belongs to the user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute('DELETE FROM telegram_accounts WHERE id = ? AND user_id = ?', (account_id, user_id))
        if c.rowcount == 0:
            conn.close()
            return {'error': 'Account not found or unauthorized'}
            
        conn.commit()
        conn.close()
        return {'status': 'success'}
    except Exception as e:
        return {'error': str(e)}
