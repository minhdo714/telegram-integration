import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')

def init_db():
    """Initialize the users database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS telegram_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            phone_number TEXT NOT NULL,
            session_string TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            telegram_user_id TEXT,
            telegram_username TEXT,
            first_name TEXT,
            last_name TEXT,
            account_ownership TEXT DEFAULT 'user_owned',
            session_status TEXT DEFAULT 'active',
            proxy_url TEXT,
            active_config_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS ai_config_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            system_prompt TEXT,
            model_provider TEXT,
            model_name TEXT,
            temperature REAL DEFAULT 0.7,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS scraped_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT UNIQUE NOT NULL,
            title TEXT,
            username TEXT,
            member_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS scraped_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            telegram_id TEXT UNIQUE NOT NULL,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            source_group_id INTEGER,
            last_seen TEXT,
            status TEXT DEFAULT 'new',
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (source_group_id) REFERENCES scraped_groups (id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS outreach_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            lead_id INTEGER NOT NULL,
            telegram_id TEXT,
            username TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            FOREIGN KEY (account_id) REFERENCES telegram_accounts (id),
            FOREIGN KEY (lead_id) REFERENCES scraped_leads (id)
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()

def register_user(email, password):
    """Register a new user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Check if user exists
        c.execute('SELECT id FROM users WHERE email = ?', (email,))
        if c.fetchone():
            conn.close()
            return {'error': 'Email already registered'}
        
        password_hash = generate_password_hash(password)
        
        c.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', (email, password_hash))
        user_id = c.lastrowid
        conn.commit()
        conn.close()
        
        # Generate a dummy token for session
        token = secrets.token_hex(16)
        
        return {
            'status': 'success',
            'user': {'id': user_id, 'email': email},
            'token': token
        }
    except Exception as e:
        return {'error': str(e)}

def login_user(email, password):
    """Login a user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute('SELECT id, email, password_hash FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        conn.close()
        
        if not user:
            return {'error': 'Invalid email or password'}
            
        user_id, email, stored_hash = user
        
        if check_password_hash(stored_hash, password):
            token = secrets.token_hex(16)
            return {
                'status': 'success',
                'user': {'id': user_id, 'email': email},
                'token': token
            }
        else:
            return {'error': 'Invalid email or password'}
            
    except Exception as e:
        return {'error': str(e)}
