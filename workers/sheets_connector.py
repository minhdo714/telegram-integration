import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json

# Load credentials from environment
GOOGLE_CREDS = json.loads(os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON'))
SHEET_ID = os.getenv('GOOGLE_SHEET_ID')

credentials = service_account.Credentials.from_service_account_info(
    GOOGLE_CREDS,
    scopes=['https://www.googleapis.com/auth/spreadsheets']
)

sheets_service = build('sheets', 'v4', credentials=credentials)

async def save_account_to_sheets(account_data):
    """Save new account to Google Sheets"""
    try:
        values = [[
            account_data.get('id'),
            account_data.get('phoneNumber'),
            account_data.get('telegramUsername'),
            account_data.get('telegramUserId'),
            account_data.get('firstName'),
            account_data.get('lastName'),
            account_data.get('sessionStatus', 'active'),
            account_data.get('integrationDate', ''),
            account_data.get('integrationMethod'),
            account_data.get('accountOwnership', 'user_owned'),
        ]]
        
        body = {'values': values}
        
        result = sheets_service.spreadsheets().values().append(
            spreadsheetId=SHEET_ID,
            range='Accounts!A:J',
            valueInputOption='RAW',
            body=body
        ).execute()
        
        # Also add session record
        session_values = [[
            account_data.get('id'),
            account_data.get('sessionFilePath'),
            '',  # last_validated
            '',  # created_at
            'active'
        ]]
        
        sheets_service.spreadsheets().values().append(
            spreadsheetId=SHEET_ID,
            range='Sessions!A:E',
            valueInputOption='RAW',
            body={'values': session_values}
        ).execute()
        
        return True
    
    except Exception as e:
        print(f"Error saving account to Sheets: {e}")
        return False

async def update_job_status(job_id, status, data=None):
    """Update job status in Google Sheets"""
    try:
        # This would update the Jobs sheet
        # Implementation depends on how you want to track jobs
        pass
    except Exception as e:
        print(f"Error updating job status: {e}")
