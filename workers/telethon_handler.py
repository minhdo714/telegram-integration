from telethon import TelegramClient, events
from telethon.tl.functions.auth import ExportLoginTokenRequest, ImportLoginTokenRequest
from telethon.errors import SessionPasswordNeededError
import asyncio
import os
import io
import qrcode
import base64
from github_session_manager import upload_session_to_github, download_session_from_github
from sheets_connector import save_account_to_sheets, update_job_status

API_ID = int(os.getenv('TELEGRAM_API_ID'))
API_HASH = os.getenv('TELEGRAM_API_HASH')

# Store active QR login sessions
qr_sessions = {}

def initiate_qr_login():
    """Initiate QR code login flow"""
    job_id = f"qr_{int(asyncio.get_event_loop().time() * 1000)}"
    
    async def qr_login():
        client = TelegramClient(io.BytesIO(), API_ID, API_HASH)
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
        qr_url = f"tg://login?token={base64.urlsafe_b64encode(token).decode().rstrip('=')}"
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
        }
        
        return {
            'jobId': job_id,
            'qrUrl': qr_url,
            'qrImage': qr_sessions[job_id]['qr_image'],
            'status': 'pending'
        }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(qr_login())
    
    # Start background task to check for login
    asyncio.create_task(check_qr_login_completion(job_id))
    
    return result

async def check_qr_login_completion(job_id):
    """Background task to check if QR was scanned"""
    if job_id not in qr_sessions:
        return
    
    client = qr_sessions[job_id]['client']
    
    try:
        # Wait for login to complete (timeout after 5 minutes)
        await asyncio.wait_for(client.is_user_authorized(), timeout=300)
        
        if await client.is_user_authorized():
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
                'integrationMethod': 'qr_code',
                'sessionFilePath': session_path,
            })
            
            qr_sessions[job_id]['status'] = 'completed'
            qr_sessions[job_id]['account_data'] = {
                'id': account_id,
                'username': me.username,
                'phone': me.phone,
            }
        
        await client.disconnect()
    except asyncio.TimeoutError:
        qr_sessions[job_id]['status'] = 'timeout'
        await client.disconnect()
    except Exception as e:
        qr_sessions[job_id]['status'] = 'error'
        qr_sessions[job_id]['error'] = str(e)
        await client.disconnect()

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

def request_sms_code(phone_number):
    """Request SMS verification code"""
    async def send_code():
        client = TelegramClient(io.BytesIO(), API_ID, API_HASH)
        await client.connect()
        
        # Send code request
        sent_code = await client.send_code_request(phone_number)
        
        await client.disconnect()
        
        return {
            'phoneHash': sent_code.phone_code_hash,
            'status': 'code_sent'
        }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(send_code())

def verify_sms_code(phone_number, code, phone_hash):
    """Verify SMS code and complete login"""
    async def sign_in():
        client = TelegramClient(io.BytesIO(), API_ID, API_HASH)
        await client.connect()
        
        try:
            await client.sign_in(phone_number, code, phone_code_hash=phone_hash)
            
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
                'username': me.username
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

def verify_2fa_password(phone_number, password):
    """Verify 2FA password"""
    async def check_password():
        client = TelegramClient(io.BytesIO(), API_ID, API_HASH)
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
                'accountId': account_id
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
            # Download session from GitHub
            session_data = await download_session_from_github(account_id)
            
            if not session_data:
                return {'status': 'invalid', 'reason': 'session_not_found'}
            
            # Try to connect with the session
            client = TelegramClient(io.BytesIO(session_data), API_ID, API_HASH)
            await client.connect()
            
            if await client.is_user_authorized():
                me = await client.get_me()
                await client.disconnect()
                return {
                    'status': 'valid',
                    'accountId': account_id,
                    'username': me.username
                }
            else:
                await client.disconnect()
                return {'status': 'invalid', 'reason': 'not_authorized'}
        
        except Exception as e:
            return {'status': 'invalid', 'reason': str(e)}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(check_session())
