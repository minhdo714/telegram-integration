from telethon import TelegramClient, events
from telethon.tl.functions.auth import ExportLoginTokenRequest, ImportLoginTokenRequest
from telethon.errors import SessionPasswordNeededError, FloodWaitError
from telethon.sessions import StringSession
import asyncio
import os
import io
import qrcode
import base64
from github_session_manager import upload_session_to_github, download_session_from_github
from sheets_connector import save_account_to_sheets, update_job_status

# Load Telegram API credentials from environment
API_ID_STR = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

if not API_ID_STR or not API_HASH:
    raise ValueError(f"Missing Telegram credentials! API_ID: {API_ID_STR is not None}, API_HASH: {API_HASH is not None}")

API_ID = int(API_ID_STR)

# Store active QR login sessions
qr_sessions = {}

import threading
import time

def initiate_qr_login():
    """Initiate QR code login flow"""
    job_id = f"qr_{int(time.time() * 1000)}"
    
    # Container for the result to pass back to the main thread
    result_container = {}
    ready_event = threading.Event()
    
    def run_async_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def qr_login_task():
            try:
                # Use a file-based session with proper string filename
                session_file = f"{job_id}.session"  
                client = TelegramClient(session_file, API_ID, API_HASH)
                await client.connect()
                
                # Request QR login token
                qr_login_token = await client(ExportLoginTokenRequest(
                    api_id=API_ID,
                    api_hash=API_HASH,
                    except_ids=[]
                ))
                
                # Generate QR code
                token = qr_login_token.token
                qr = qrcode.QRCode(box_size=10, border=4)
                qr_url = f"tg://login?token={base64.urlsafe_b64encode(token).decode()}"
                print(f"DEBUG: Generated QR URL: {qr_url}")
                qr.add_data(qr_url)
                qr.make()
                
                # Convert QR to base64 image
                img_buffer = io.BytesIO()
                qr_img = qr.make_image(fill_color="black", back_color="white")
                qr_img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
                
                # Store client for status checking
                qr_sessions[job_id] = {
                    'client': client,
                    'status': 'pending',
                    'qr_url': qr_url,
                    'qr_image': f"data:image/png;base64,{qr_base64}",
                    'session_file': f"{job_id}.session"
                }
                
                result_container['data'] = {
                    'jobId': job_id,
                    'qrUrl': qr_url,
                    'qrImage': qr_sessions[job_id]['qr_image'],
                    'status': 'pending'
                }
                
                # Signal that QR is ready
                ready_event.set()
                
                # Continue preventing the loop from closing by running the check task
                # This will block inside this async task until completion or timeout
                await check_qr_login_completion(job_id)
                
            except Exception as e:
                print(f"Error in QR login task: {e}")
                # Ensure we don't block forever if error occurs before ready
                ready_event.set()

        loop.run_until_complete(qr_login_task())
        loop.close()
    
    # Start the async loop in a separate thread
    thread = threading.Thread(target=run_async_loop, daemon=True)
    thread.start()
    
    # Wait for the QR code to be generated
    ready_event.wait(timeout=15)
    
    if 'data' not in result_container:
        raise Exception("Timeout generating QR code")
        
    return result_container['data']

async def check_qr_login_completion(job_id):
    """Background task to check if QR was scanned"""
    if job_id not in qr_sessions:
        print(f"ERROR: Job {job_id} not found in qr_sessions")
        return
    
    client = qr_sessions[job_id]['client']
    session_file = qr_sessions[job_id].get('session_file')
    
    print(f"DEBUG: Starting QR completion check for job {job_id}")
    print(f"DEBUG: Watching session file: {session_file}")
    
    # Get initial file modification time
    initial_mtime = 0
    initial_size = 0
    if os.path.exists(session_file):
        initial_mtime = os.path.getmtime(session_file)
        initial_size = os.path.getsize(session_file)
        print(f"DEBUG: Initial session file - size: {initial_size} bytes, mtime: {initial_mtime}")
    
    # Wait a moment for the initial session setup to complete
    await asyncio.sleep(3)
    
    try:
        # Poll for session file changes (timeout after 5 minutes)
        start_time = time.time()
        poll_count = 0
        
        while time.time() - start_time < 300:
            poll_count += 1
            
            # Check if session file was modified (QR was scanned)
            session_authorized = False
            if os.path.exists(session_file):
                current_mtime = os.path.getmtime(session_file)
                current_size = os.path.getsize(session_file)
                # Session file gets modified when QR is scanned
                if current_mtime > initial_mtime:
                    session_authorized = True
                    
            if poll_count % 10 == 0:  # Log every 10 polls (20 seconds)
                if os.path.exists(session_file):
                    file_mtime = os.path.getmtime(session_file)
                    file_size = os.path.getsize(session_file)
                    print(f"DEBUG: Job {job_id} - Poll #{poll_count}, size: {file_size} bytes, mtime_diff: {file_mtime - initial_mtime:.2f}s, elapsed: {int(time.time() - start_time)}s")
                else:
                    print(f"DEBUG: Job {job_id} - Poll #{poll_count}, file not found, elapsed: {int(time.time() - start_time)}s")
            
            if session_authorized:
                print(f"SUCCESS: Job {job_id} - Session file was modified! QR was scanned!")
                # Wait a bit more for session to fully write
                await asyncio.sleep(2)
                break
                
            await asyncio.sleep(2)
        
        # Check if session file was modified
        if os.path.exists(session_file):
            current_mtime = os.path.getmtime(session_file)
            current_size = os.path.getsize(session_file)
            
            if current_mtime > initial_mtime:
                print(f"DEBUG: Job {job_id} - Session file confirmed modified (size: {current_size} bytes, mtime_diff: {current_mtime - initial_mtime:.2f}s), reconnecting to verify...")
                
                # Disconnect old client
                await client.disconnect()
                await asyncio.sleep(1)
                
                # Create new client with the session file to get user info
                verified_client = TelegramClient(job_id, API_ID, API_HASH)
                await verified_client.connect()
                
                if await verified_client.is_user_authorized():
                    print(f"SUCCESS: Job {job_id} - User is authorized!")
                    me = await verified_client.get_me()
                    account_id = str(me.id)
                    
                    print(f"SUCCESS: Job {job_id} - Got user info: {me.username} (ID: {account_id})")
                    
                    # Disconnect to flush
                    await verified_client.disconnect()
                    
                    # Read session file
                    with open(session_file, 'rb') as f:
                        session_data = f.read()
                    print(f"DEBUG: Job {job_id} - Read session file ({len(session_data)} bytes)")
                    
                    # Upload session to GitHub (Optional)
                    session_path = "local_only"
                    try:
                        session_path = await upload_session_to_github(account_id, session_data)
                        print(f"DEBUG: Job {job_id} - Uploaded session to GitHub")
                    except Exception as e:
                        print(f"Warning: Failed to upload session to GitHub: {e}")
                    
                    # Save to Google Sheets (Optional)
                    try:
                        await save_account_to_sheets({
                            'id': account_id,
                            'phoneNumber': me.phone,
                            'telegramUsername': me.username,
                            'telegramUserId': str(me.id),
                            'firstName': me.first_name,
                            'lastName': me.last_name,
                            'sessionStatus': 'active',
                            'integrationMethod': 'qr_code',
                            'sessionFilePath': session_path,
                        })
                        print(f"DEBUG: Job {job_id} - Saved to Google Sheets")
                    except Exception as e:
                        print(f"Warning: Failed to save to Sheets: {e}")

                    # Cleanup session file
                    if os.path.exists(session_file):
                        try:
                            os.remove(session_file)
                            print(f"DEBUG: Job {job_id} - Cleaned up session file")
                        except Exception as e:
                            print(f"Warning: Failed to remove session file: {e}")

                    qr_sessions[job_id]['status'] = 'completed'
                    qr_sessions[job_id]['account_data'] = {
                        'id': account_id,
                        'username': me.username,
                        'phone': me.phone,
                        'session_string': session_data.decode('latin-1') if isinstance(session_data, bytes) else session_data
                    }
                    print(f"SUCCESS: Job {job_id} - Status set to COMPLETED")
                else:
                    print(f"ERROR: Job {job_id} - Session file exists but user not authorized")
                    await verified_client.disconnect()
                    qr_sessions[job_id]['status'] = 'error'
                    qr_sessions[job_id]['error'] = 'Session file created but not authorized'
            else:
                print(f"TIMEOUT: Job {job_id} - QR code was not scanned within 5 minutes")
                await client.disconnect()
                qr_sessions[job_id]['status'] = 'timeout'
        else:
            print(f"TIMEOUT: Job {job_id} - Session file was never created")
            await client.disconnect()
            qr_sessions[job_id]['status'] = 'timeout'
            
    except asyncio.TimeoutError:
        print(f"ERROR: Job {job_id} - Asyncio timeout")
        qr_sessions[job_id]['status'] = 'timeout'
        try:
             await client.disconnect()
             if os.path.exists(session_file):
                 os.remove(session_file)
        except:
             pass
    except Exception as e:
        print(f"ERROR: Job {job_id} - Exception during check: {e}")
        import traceback
        traceback.print_exc()
        qr_sessions[job_id]['status'] = 'error'
        qr_sessions[job_id]['error'] = str(e)
        try:
             await client.disconnect()
             if os.path.exists(session_file):
                 os.remove(session_file)
        except:
             pass

def check_qr_status(job_id):
    """Check the status of a QR login job"""
    if job_id not in qr_sessions:
        return {'status': 'not_found'}
    
    session = qr_sessions[job_id]
    result = {'status': session['status']}
    
    if session['status'] == 'completed':
        result['accountData'] = session['account_data']
    elif session['status'] == 'error':
        result['error'] = session.get('error', 'Unknown error')
    
    return result

def request_sms_code(phone_number, session_string=None):
    """Request SMS verification code"""
    async def send_code():
        # Use existing session if available (for resends)
        if session_string:
            client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
        else:
            client = TelegramClient(StringSession(), API_ID, API_HASH)
            
        await client.connect()
        
        # Send code request
        sent_code = await client.send_code_request(phone_number)
        print(f"DEBUG: Sent code response: {sent_code}")
        
        # Capture the session string to persist context for verification
        saved_session = client.session.save()
        
        await client.disconnect()
        
        return {
            'phoneHash': sent_code.phone_code_hash,
            'sessionString': saved_session,
            'status': 'code_sent'
        }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(send_code())
    except FloodWaitError as e:
        return {
            'status': 'error',
            'error': f'Rate limit exceeded. Please wait {e.seconds} seconds.',
            'wait_seconds': e.seconds
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def verify_sms_code(phone_number, code, phone_hash, session_string=None):
    """Verify SMS code and complete login"""
    async def sign_in():
        # Use the provided session string to maintain context/auth key
        # If no session string (legacy), try fresh session (might fail with 'expired')
        if session_string:
            client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
        else:
            client = TelegramClient(StringSession(), API_ID, API_HASH)
            
        await client.connect()
        
        try:
            await client.sign_in(phone_number, code, phone_code_hash=phone_hash)
            
            me = await client.get_me()
            session_data = client.session.save()
            
            account_id = str(me.id)
            
            # Upload session to GitHub (optional)
            session_path = None
            try:
                session_path = await upload_session_to_github(account_id, session_data)
            except Exception as github_error:
                print(f"WARNING: Failed to upload to GitHub: {github_error}")
            
            # Save to Google Sheets (optional)
            try:
                await save_account_to_sheets({
                    'id': account_id,
                    'phoneNumber': me.phone,
                    'telegramUsername': me.username,
                    'telegramUserId': str(me.id),
                    'firstName': me.first_name,
                    'lastName': me.last_name,
                    'sessionStatus': 'active',
                    'integrationMethod': 'sms',
                    'sessionFilePath': session_path,
                })
            except Exception as sheets_error:
                print(f"WARNING: Failed to save to Google Sheets: {sheets_error}")
            
            await client.disconnect()
            
            return {
                'status': 'success',
                'account': {
                    'id': account_id,
                    'phone': me.phone,
                    'username': me.username,
                    'firstName': me.first_name,
                    'lastName': me.last_name,
                    'session_string': session_data
                }
            }
        
        except SessionPasswordNeededError:
            await client.disconnect()
            return {
                'status': 'password_required',
                'message': '2FA password required'
            }
        except Exception as e:
            await client.disconnect()
            return {
                'status': 'error',
                'error': str(e)
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(sign_in())

def verify_2fa_password(phone_number, password, session_string=None):
    """Verify 2FA password"""
    async def check_password():
        # Use the provided session string to maintain context
        if session_string:
            client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
        else:
            client = TelegramClient(StringSession(), API_ID, API_HASH)
            
        await client.connect()
        
        try:
            await client.sign_in(password=password)
            
            me = await client.get_me()
            session_data = client.session.save()
            
            account_id = str(me.id)
            
            # Upload session to GitHub
            session_path = await upload_session_to_github(account_id, session_data)
            
            # Save to Google Sheets
            await save_account_to_sheets({
                'id': account_id,
                'phoneNumber': me.phone,
                'telegramUsername': me.username,
                'telegramUserId': str(me.id),
                'firstName': me.first_name,
                'lastName': me.last_name,
                'sessionStatus': 'active',
                'integrationMethod': 'sms',
                'sessionFilePath': session_path,
            })
            
            await client.disconnect()
            
            return {
                'status': 'success',
                'accountId': account_id,
                'session_string': session_data
            }
        except Exception as e:
            await client.disconnect()
            return {
                'status': 'error',
                'error': str(e)
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(check_password())

def validate_session(account_id):
    """Validate if a session is still active"""
    async def check_session():
        try:
            # Get session from database instead of GitHub
            import sqlite3
            from auth_handler import DB_PATH
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT session_string FROM telegram_accounts WHERE id = ?', (account_id,))
            result = c.fetchone()
            conn.close()
            
            if not result or not result[0]:
                return {'status': 'invalid', 'reason': 'session_not_found', 'message': 'Session not found in database'}
            
            session_data = result[0]
            
            # Try to connect with the session
            if isinstance(session_data, bytes):
                session_data = session_data.decode('utf-8')
                
            client = TelegramClient(StringSession(session_data), API_ID, API_HASH)
            
            try:
                await client.connect()
                
                if await client.is_user_authorized():
                    me = await client.get_me()
                    await client.disconnect()
                    return {
                        'status': 'valid',
                        'accountId': account_id,
                        'username': me.username,
                        'message': 'Session is active and valid'
                    }
                else:
                    await client.disconnect()
                    return {'status': 'invalid', 'reason': 'not_authorized', 'message': 'Session is not authorized'}
            except Exception as e:
                await client.disconnect()
                raise e
        
        except Exception as e:
            return {'status': 'invalid', 'reason': str(e), 'message': f'Validation failed: {str(e)}'}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(check_session())


def send_dm(account_id, recipient, message):
    """Send a direct message using a Telegram account"""
    async def send_message():
        try:
            # Get session from database
            import sqlite3
            from auth_handler import DB_PATH
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT session_string FROM telegram_accounts WHERE id = ?', (account_id,))
            result = c.fetchone()
            conn.close()
            
            if not result or not result[0]:
                return {
                    'status': 'error',
                    'error_type': 'session_invalid',
                    'message': 'Session not found in database'
                }
            
            session_data = result[0]
            if isinstance(session_data, bytes):
                session_data = session_data.decode('utf-8')
            
            # Create Telethon client
            client = TelegramClient(StringSession(session_data), API_ID, API_HASH)
            
            try:
                await client.connect()
                
                if not await client.is_user_authorized():
                    await client.disconnect()
                    return {
                        'status': 'error',
                        'error_type': 'session_invalid',
                        'message': 'Session is not authorized. Please re-authenticate.'
                    }
                
                # Resolve recipient (username or phone number)
                try:
                    # Remove @ if present
                    recipient_clean = recipient.lstrip('@')
                    
                    # Try to resolve as username first
                    try:
                        entity = await client.get_entity(recipient_clean)
                    except:
                        # If username fails, try as phone number
                        entity = await client.get_entity(recipient)
                    
                except ValueError:
                    await client.disconnect()
                    return {
                        'status': 'error',
                        'error_type': 'user_not_found',
                        'message': f'User "{recipient}" not found'
                    }
                except Exception as resolve_error:
                    await client.disconnect()
                    return {
                        'status': 'error',
                        'error_type': 'resolution_failed',
                        'message': f'Could not resolve recipient: {str(resolve_error)}'
                    }
                
                # Send the message
                try:
                    sent_message = await client.send_message(entity, message)
                    await client.disconnect()
                    
                    # Get recipient info
                    recipient_name = getattr(entity, 'username', None) or getattr(entity, 'phone', 'Unknown')
                    
                    return {
                        'status': 'success',
                        'message_id': sent_message.id,
                        'sent_to': recipient_name,
                        'timestamp': sent_message.date.isoformat()
                    }
                    
                except FloodWaitError as flood_error:
                    await client.disconnect()
                    return {
                        'status': 'error',
                        'error_type': 'rate_limited',
                        'message': f'Rate limited. Please wait {flood_error.seconds} seconds.',
                        'retry_after': flood_error.seconds
                    }
                except ChatWriteForbiddenError:
                    await client.disconnect()
                    return {
                        'status': 'error',
                        'error_type': 'blocked',
                        'message': 'You cannot send messages to this user (blocked or privacy settings)'
                    }
                except UserIsBlockedError:
                    await client.disconnect()
                    return {
                        'status': 'error',
                        'error_type': 'blocked',
                        'message': 'This user has blocked you'
                    }
                except Exception as send_error:
                    await client.disconnect()
                    error_msg = str(send_error).lower()
                    if 'privacy' in error_msg:
                        return {
                            'status': 'error',
                            'error_type': 'privacy_restricted',
                            'message': 'Cannot send message due to recipient privacy settings'
                        }
                    return {
                        'status': 'error',
                        'error_type': 'send_failed',
                        'message': f'Failed to send message: {str(send_error)}'
                    }
                    
            except Exception as client_error:
                await client.disconnect()
                return {
                    'status': 'error',
                    'error_type': 'connection_failed',
                    'message': f'Failed to connect to Telegram: {str(client_error)}'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error_type': 'unknown',
                'message': f'Unexpected error: {str(e)}'
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(send_message())
