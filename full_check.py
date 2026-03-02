import sqlite3
import os

db_path = 'workers/users.db'
print("=" * 60)
print("FULL SYSTEM CHECK")
print("=" * 60)

if not os.path.exists(db_path):
    print(f"ERROR: {db_path} does not exist!")
else:
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Check accounts
        c.execute('SELECT count(*) FROM telegram_accounts')
        count = c.fetchone()[0]
        print(f"\nTotal accounts in DB: {count}")
        
        if count > 0:
            c.execute('''
                SELECT id, phone_number, telegram_username, status, session_status, 
                       length(session_string), substr(session_string, 1, 50)
                FROM telegram_accounts
            ''')
            for row in c.fetchall():
                print(f"\n  Account ID: {row[0]}")
                print(f"  Phone: {row[1]}")
                print(f"  Username: {row[2]}")
                print(f"  Status: {row[3]}")
                print(f"  Session Status: {row[4]}")
                print(f"  Session Length: {row[5] if row[5] else 0} chars")
                print(f"  Session Preview: {row[6] if row[6] else 'N/A'}...")
                
                # Check if it looks like a valid StringSession
                if row[5] and row[5] > 100:
                    print(f"  [OK] Session looks valid (good length)")
                else:
                    print(f"  [ERROR] Session looks INVALID (too short!)")
        
        # Check active sessions
        c.execute('''
            SELECT count(*) FROM telegram_accounts 
            WHERE status = 'active' AND session_status = 'active'
        ''')
        active = c.fetchone()[0]
        print(f"\n[OK] Active accounts ready for bot: {active}")
        
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

# Check if bot_runner is running
print("\n" + "=" * 60)
print("Checking bot_runner.py log...")
print("=" * 60)

log_path = 'workers/bot.log'
if os.path.exists(log_path):
    with open(log_path, 'r') as f:
        lines = f.readlines()
        print("\nLast 10 lines from bot.log:")
        for line in lines[-10:]:
            print(f"  {line.strip()}")
else:
    print("❌ bot.log not found!")

print("\n" + "=" * 60)
print("END OF CHECK")
print("=" * 60)
