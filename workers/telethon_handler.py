from telethon import TelegramClient, events, functions, types
from telethon.tl.functions.auth import ExportLoginTokenRequest, ImportLoginTokenRequest
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.functions.channels import JoinChannelRequest, GetParticipantsRequest
from telethon.tl.functions.messages import GetDialogsRequest
from telethon.tl.types import ChannelParticipantsSearch, UserStatusOnline, UserStatusRecently, UserStatusOffline, InputMessagesFilterChatPhotos
from telethon.errors import SessionPasswordNeededError, FloodWaitError, ChatWriteForbiddenError, UserIsBlockedError
from telethon.sessions import StringSession
import asyncio
import os
import io
import qrcode
import base64
import traceback
from github_session_manager import upload_session_to_github, download_session_from_github
from sheets_connector import save_account_to_sheets, update_job_status
from account_manager import add_account

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
                    # await verified_client.disconnect() # Don't disconnect yet, we need session info!
                    
                    # Convert to StringSession
                    from telethon.sessions import StringSession
                    string_session = StringSession()
                    string_session.set_dc(verified_client.session.dc_id, verified_client.session.server_address, verified_client.session.port)
                    string_session.auth_key = verified_client.session.auth_key
                    session_data_str = string_session.save()
                    
                    print(f"DEBUG: Job {job_id} - Generated StringSession (len: {len(session_data_str)})")
                    
                    if len(session_data_str) < 50:
                        print(f"ERROR: Job {job_id} - Generated session string is suspiciously short! ({len(session_data_str)} chars). ABORTING SAVE.")
                    else:
                        # SAVE TO DB IMMEDIATELY (Server-side reliability)
                        from account_manager import add_account
                        try:
                            print(f"DEBUG: calling add_account for {account_id}")
                            add_account(
                                user_id=1, # Default user
                                phone_number=me.phone,
                                session_string=session_data_str,
                                telegram_user_id=str(me.id),
                                telegram_username=me.username,
                                first_name=me.first_name,
                                last_name=me.last_name,
                                account_ownership='user_owned',
                                session_status='active'
                            )
                            print(f"SUCCESS: Job {job_id} - Account saved to DB server-side.")
                        except Exception as e:
                            print(f"ERROR: Job {job_id} - Failed to save account to DB: {e}")
                            import traceback
                            traceback.print_exc()

                    await verified_client.disconnect()
                    
                    # Upload session to GitHub (Optional)
                    session_path = "local_only"
                    try:
                        # Upload the STRING session, not bytes
                        session_path = await upload_session_to_github(account_id, session_data_str.encode('utf-8'))
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
                        'session_string': session_data_str
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
            try:
                client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
            except Exception as e:
                print(f"WARNING: Failed to load session_string ({e}), falling back to fresh session")
                client = TelegramClient(StringSession(), API_ID, API_HASH)
        else:
            client = TelegramClient(StringSession(), API_ID, API_HASH)
            
        await client.connect()
        
        try:
            await client.sign_in(phone_number, code, phone_code_hash=phone_hash)
            
            me = await client.get_me()
            session_data = client.session.save()
            print(f"DEBUG: SMS Login - Generated Session String (len: {len(session_data)})")
            
            account_id = str(me.id)
            
            # Upload session to GitHub (optional)
            session_path = None
            try:
                session_path = await upload_session_to_github(account_id, session_data)
            except Exception as github_error:
                print(f"WARNING: Failed to upload to GitHub: {github_error}")
            
            # Save to database (REQUIRED)
            # Note: user_id defaults to 1 for now
            user_id = 1
            try:
                add_account(
                    user_id=user_id,
                    phone_number=me.phone,
                    session_string=session_data,
                    telegram_user_id=str(me.id),
                    telegram_username=me.username,
                    first_name=me.first_name,
                    last_name=me.last_name,
                    account_ownership='user_owned',
                    session_status='active'
                )
                print(f"SUCCESS: Saved account {account_id} to database for user {user_id}")
            except Exception as db_error:
                print(f"ERROR: Failed to save to database: {db_error}")
            
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
            print(f"DEBUG: 2FA Login - Generated Session String (len: {len(session_data)})")
            
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

import urllib.parse

def parse_proxy(proxy_url):
    """Parse proxy URL into python-socks format tuple"""
    if not proxy_url:
        return None
    
    try:
        parsed = urllib.parse.urlparse(proxy_url)
        scheme = parsed.scheme.lower()
        
        proxy_type = None
        if 'socks5' in scheme:
            import socks
            proxy_type = socks.SOCKS5
        elif 'socks4' in scheme:
            import socks
            proxy_type = socks.SOCKS4
        elif 'http' in scheme:
            proxy_type = 'http' # Telethon accepts 'http' string for HTTP proxies
        
        if not proxy_type:
            return None
            
        # Telethon proxy tuple: (mode, addr, port, rdns, username, password)
        # rdns=True is generally good for privacy
        
        return (proxy_type, parsed.hostname, parsed.port, True, parsed.username, parsed.password)
    except Exception as e:
        print(f"Error parsing proxy {proxy_url}: {e}")
        return None

def validate_session(account_id):
    """Validate if a session is still active"""
    async def check_session():
        try:
            # Get session from database instead of GitHub
            import sqlite3
            from auth_handler import DB_PATH
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT session_string, proxy_url FROM telegram_accounts WHERE id = ?', (account_id,))
            result = c.fetchone()
            conn.close()
            
            if not result or not result[0]:
                return {'status': 'invalid', 'reason': 'session_not_found', 'message': 'Session not found in database'}
            
            session_data = result[0]
            proxy_url = result[1]
            proxy = parse_proxy(proxy_url)
            
            # Try to connect with the session
            if isinstance(session_data, bytes):
                session_data = session_data.decode('utf-8')
                
            client = TelegramClient(StringSession(session_data), API_ID, API_HASH, proxy=proxy)
            
            try:
                # Set lower timeout for validation
                await client.connect()
                
                if await client.is_user_authorized():
                    me = await client.get_me()
                    await client.disconnect()
                    
                    # Update status in DB to ensure it's marked active
                    conn = sqlite3.connect(DB_PATH)
                    c = conn.cursor()
                    c.execute('UPDATE telegram_accounts SET session_status = "active" WHERE id = ?', (account_id,))
                    conn.commit()
                    conn.close()
                    
                    return {
                        'status': 'valid',
                        'accountId': account_id,
                        'username': me.username,
                        'message': 'Session is active and valid' + (' (Proxy Enabled)' if proxy else '')
                    }
                else:
                    await client.disconnect()
                    
                    # Update status in DB
                    conn = sqlite3.connect(DB_PATH)
                    c = conn.cursor()
                    c.execute('UPDATE telegram_accounts SET session_status = "expired" WHERE id = ?', (account_id,))
                    conn.commit()
                    conn.close()
                    
                    return {'status': 'invalid', 'reason': 'not_authorized', 'message': 'Session is not authorized. Please re-link.'}
            except Exception as e:
                await client.disconnect()
                
                # If error is a session error, mark as expired
                error_msg = str(e).lower()
                if 'unauthorized' in error_msg or 'revoked' in error_msg:
                    conn = sqlite3.connect(DB_PATH)
                    c = conn.cursor()
                    c.execute('UPDATE telegram_accounts SET session_status = "expired" WHERE id = ?', (account_id,))
                    conn.commit()
                    conn.close()
                
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
            c.execute('SELECT session_string, proxy_url FROM telegram_accounts WHERE id = ?', (account_id,))
            result = c.fetchone()
            conn.close()
            
            if not result or not result[0]:
                return {
                    'status': 'error',
                    'error_type': 'session_invalid',
                    'message': 'Session not found in database'
                }
            
            session_data = result[0]
            proxy_url = result[1]
            proxy = parse_proxy(proxy_url)

            if isinstance(session_data, bytes):
                session_data = session_data.decode('utf-8')
            
            # Create Telethon client
            client = TelegramClient(StringSession(session_data), API_ID, API_HASH, proxy=proxy)
            
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
                    
                    # Create/Update session in DB so AI knows the state
                    try:
                        recipient_id = entity.id
                        recipient_username = getattr(entity, 'username', None)
                        
                        # Import here to avoid circular dependency if possible, or move to top
                        # We use raw SQL to avoid dependency on AIHandler for now
                        conn_db = sqlite3.connect(DB_PATH)
                        c_db = conn_db.cursor()
                        
                        # Update scraped_leads and outreach_history
                        try:
                            # Try to find lead by telegram_id or username
                            c_db.execute('SELECT id FROM scraped_leads WHERE telegram_id = ? OR (username IS NOT NULL AND username = ?)', (str(recipient_id), recipient_username))
                            lead = c_db.fetchone()
                            
                            if lead:
                                lead_id = lead[0]
                                # Mark as blasted
                                c_db.execute('UPDATE scraped_leads SET status = "blasted" WHERE id = ?', (lead_id,))
                                # Record in history
                                c_db.execute('''
                                    INSERT INTO outreach_history (account_id, lead_id, telegram_id, username, status)
                                    VALUES (?, ?, ?, ?, ?)
                                ''', (account_id, lead_id, str(recipient_id), recipient_username, 'sent'))
                            else:
                                # Not a known lead? Still log the history
                                c_db.execute('''
                                    INSERT INTO outreach_history (account_id, telegram_id, username, status)
                                    VALUES (?, ?, ?, ?)
                                ''', (account_id, str(recipient_id), recipient_username, 'sent'))
                        except Exception as h_e:
                            print(f"Warning: Failed to log outreach history: {h_e}")

                        conn_db.commit()
                        conn_db.close()
                    except Exception as db_e:
                        print(f"Warning: Failed to create session context: {db_e}")

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

async def get_client(account_id):
    """Helper to get an authorized Telethon client for an account"""
    import sqlite3
    from auth_handler import DB_PATH
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT session_string, proxy_url FROM telegram_accounts WHERE id = ?', (account_id,))
    result = c.fetchone()
    conn.close()
    
    if not result or not result[0]:
        return None, "Session not found"
        
    session_data = result[0]
    proxy_url = result[1]
    proxy = parse_proxy(proxy_url)

    if isinstance(session_data, bytes):
        session_data = session_data.decode('utf-8')
    
    print(f"DEBUG: get_client for {account_id}")
    client = TelegramClient(StringSession(session_data), API_ID, API_HASH, proxy=proxy)
    await client.connect()
    print(f"DEBUG: client connected")
    
    if not await client.is_user_authorized():
        print(f"DEBUG: client NOT authorized")
        await client.disconnect()
        
        # Update status in DB
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE telegram_accounts SET session_status = "expired" WHERE id = ?', (account_id,))
        conn.commit()
        conn.close()
        
        return None, "Session not authorized"
        
    print(f"DEBUG: client authorized as {(await client.get_me()).username}")
    return client, None

def search_groups(account_id, query):
    """Search for public groups/channels by query"""
    async def run():
        client, error = await get_client(account_id)
        if error: return {"status": "error", "message": error}
        
        try:
            # Search for chats
            result = await client(functions.contacts.SearchRequest(
                q=query,
                limit=20
            ))
            
            groups = []
            for chat in result.chats:
                # Include supergroups and channels
                is_group = getattr(chat, 'megagroup', False) or not getattr(chat, 'broadcast', False)
                
                groups.append({
                    'id': chat.id,
                    'title': chat.title,
                    'username': getattr(chat, 'username', None),
                    'member_count': getattr(chat, 'participants_count', 0),
                    'is_public': getattr(chat, 'username', None) is not None,
                    'type': 'supergroup' if getattr(chat, 'megagroup', False) else ('channel' if getattr(chat, 'broadcast', False) else 'group')
                })
            
            await client.disconnect()
            return {"status": "success", "groups": groups}
        except Exception as e:
            await client.disconnect()
            return {"status": "error", "message": str(e)}

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(run())

def get_my_groups(account_id):
    """Get groups/channels the account has already joined"""
    async def run():
        client, error = await get_client(account_id)
        if error: return {"status": "error", "message": error}
        
        try:
            dialogs = await client.get_dialogs()
            groups = []
            for d in dialogs:
                if d.is_group or d.is_channel:
                    groups.append({
                        'id': d.id,
                        'title': d.title,
                        'username': getattr(d.entity, 'username', None),
                        'member_count': getattr(d.entity, 'participants_count', 0)
                    })
            
            await client.disconnect()
            return {"status": "success", "groups": groups}
        except Exception as e:
            await client.disconnect()
            return {"status": "error", "message": str(e)}

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(run())

def join_group(account_id, group_username):
    """Join a group or channel by username"""
    async def run():
        client, error = await get_client(account_id)
        if error: return {"status": "error", "message": error}
        
        try:
            await client(JoinChannelRequest(group_username))
            await client.disconnect()
            return {"status": "success"}
        except Exception as e:
            await client.disconnect()
            return {"status": "error", "message": str(e)}

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(run())

def scrape_members(account_id, group_id, limit=50):
    """Scrape active members from a group and save to DB"""
    async def run():
        client, error = await get_client(account_id)
        if error: return {"status": "error", "message": error}
        
        try:
            print(f"DEBUG: Resolving entity {group_id}")
            entity = await client.get_entity(group_id)
            print(f"DEBUG: Entity resolved: {entity.title}")
            
            # Save group info to DB first
            import sqlite3
            from auth_handler import DB_PATH
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            c.execute('''
                INSERT OR IGNORE INTO scraped_groups (telegram_id, title, username, member_count)
                VALUES (?, ?, ?, ?)
            ''', (str(entity.id), entity.title, getattr(entity, 'username', None), getattr(entity, 'participants_count', 0)))
            
            c.execute('SELECT user_id FROM telegram_accounts WHERE id = ?', (account_id,))
            user_id_row = c.fetchone()
            real_user_id = user_id_row[0] if user_id_row else 1
            
            c.execute('SELECT id FROM scraped_groups WHERE telegram_id = ?', (str(entity.id),))
            group_db_id = c.fetchone()[0]
            
            # Scrape participants
            print(f"DEBUG: Getting participants for {entity.title}...")
            participants = await client.get_participants(entity, limit=limit)
            print(f"DEBUG: Found {len(participants)} total participants (including bots/hidden)")
            
            leads_added = 0
            for p in participants:
                if p.bot: continue
                
                # Filter for active users (Relaxed filter: Anyone with a username/phone or recent status)
                is_active = True # Default to true for now to maximize leads
                if isinstance(p.status, types.UserStatusLastMonth):
                    is_active = False # Too inactive
                
                if not is_active: continue
                
                try:
                    c.execute('''
                        INSERT OR IGNORE INTO scraped_leads (user_id, telegram_id, username, first_name, last_name, source_group_id, last_seen)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (real_user_id, str(p.id), p.username, p.first_name, p.last_name, group_db_id, str(p.status) if p.status else None))
                    if c.rowcount > 0:
                        leads_added += 1
                except Exception as e:
                    print(f"DEBUG: Failed to insert lead {p.id}: {e}")
                    pass
            
            conn.commit()
            conn.close()
            
            await client.disconnect()
            return {"status": "success", "leads_added": leads_added}
        except Exception as e:
            traceback.print_exc()
            await client.disconnect()
            return {"status": "error", "message": str(e)}

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(run())

def logout_account(account_id):
    """Log out of a Telegram account to revoke the session"""
    async def run():
        # This will use the authorized client (with proxy if set)
        client, error = await get_client(account_id)
        if error:
            print(f"DEBUG: logout_account failed to get client: {error}")
            return {"status": "error", "message": error}
        
        try:
            print(f"DEBUG: Logging out account {account_id}")
            # log_out() revokes the session on Telegram's servers
            await client.log_out()
            print(f"DEBUG: Successfully logged out account {account_id}")
            return {"status": "success"}
        except Exception as e:
            print(f"ERROR: Failed to log out account {account_id}: {str(e)}")
            return {"status": "error", "message": str(e)}
        finally:
            if client:
                await client.disconnect()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(run())
