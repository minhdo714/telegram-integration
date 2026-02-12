import sys
import os

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from workers.account_manager import add_account
from workers.auth_handler import DB_PATH

print(f"Testing DB Insert to: {DB_PATH}")

try:
    result = add_account(
        user_id=1,
        phone_number='17143329798', # Use the user's phone for realism
        session_string='dummy_session_string',
        telegram_user_id='123456789',
        telegram_username='test_user',
        first_name='Test',
        last_name='User',
        account_ownership='user_owned',
        session_status='active'
    )
    print(f"Result: {result}")
except Exception as e:
    print(f"CRITICAL EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
