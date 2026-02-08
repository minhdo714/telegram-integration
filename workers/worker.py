from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

from telethon_handler import (
    initiate_qr_login,
    check_qr_status,
    request_sms_code,
    verify_sms_code,
    verify_2fa_password,
    validate_session,
    send_dm
)
from auth_handler import register_user, login_user
from werkzeug.utils import secure_filename
import sqlite3
import json
import subprocess
import sys
import time
import traceback
from flask import send_from_directory

app = Flask(__name__)
# Allow requests from production (Vercel) and development (localhost)
# In production, update the Vercel URL after deployment
CORS(app, origins=[
    'https://*.vercel.app',  # All Vercel deployments
    'http://localhost:3000', # Local development
    'http://127.0.0.1:3000'  # Alternative localhost
], supports_credentials=True)

import sqlite3
DB_PATH = os.getenv('DB_PATH', 'users.db')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "telegram-worker"}), 200

@app.route('/debug/env', methods=['GET'])
def debug_env():
    """Debug endpoint to check environment variables"""
    return jsonify({
        "has_telegram_api_id": os.getenv('TELEGRAM_API_ID') is not None,
        "has_telegram_api_hash": os.getenv('TELEGRAM_API_HASH') is not None,
        "has_github_token": os.getenv('GITHUB_TOKEN') is not None,
        "has_kie_api_key": os.getenv('KIE_API_KEY') is not None,
        "telegram_api_id_value": os.getenv('TELEGRAM_API_ID', 'NOT_SET')[:5] + "..." if os.getenv('TELEGRAM_API_ID') else "NOT_SET"
    }), 200

@app.route('/api/qr-login/initiate', methods=['POST'])
def qr_login_initiate():
    try:
        result = initiate_qr_login()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/qr-login/status/<job_id>', methods=['GET'])
def qr_login_status(job_id):
    try:
        result = check_qr_status(job_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sms-login/request-code', methods=['POST'])
def sms_request_code():
    try:
        data = request.json
        phone_number = data.get('phoneNumber')
        session_string = data.get('sessionString')
        
        if not phone_number:
            return jsonify({"error": "Phone number required"}), 400
        
        result = request_sms_code(phone_number, session_string)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sms-login/verify-code', methods=['POST'])
def sms_verify_code():
    try:
        data = request.json
        phone_number = data.get('phoneNumber')
        code = data.get('code')
        phone_hash = data.get('phoneHash')
        session_string = data.get('sessionString')
        
        if not all([phone_number, code, phone_hash]):
            return jsonify({"error": "Missing required fields"}), 400
        
        result = verify_sms_code(phone_number, code, phone_hash, session_string)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sms-login/verify-password', methods=['POST'])
def sms_verify_password():
    try:
        data = request.json
        phone_number = data.get('phoneNumber')
        password = data.get('password')
        session_string = data.get('sessionString')
        
        if not all([phone_number, password]):
            return jsonify({"error": "Missing required fields"}), 400
        
        result = verify_2fa_password(phone_number, password, session_string)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/validate-session', methods=['POST'])
def validate_session_route():
    try:
        data = request.json
        account_id = data.get('accountId')
        
        if not account_id:
            return jsonify({"error": "Account ID required"}), 400
        
        result = validate_session(account_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register_route():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
            
        result = register_user(email, password)
        if 'error' in result:
             return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login_route():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
            
        result = login_user(email, password)
        if 'error' in result:
             return jsonify(result), 401
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Account Management Routes
from account_manager import add_account, get_user_accounts, delete_account

@app.route('/api/accounts', methods=['GET'])
def list_accounts():
    try:
        # In a real app, verify token. Here we expect userId in query param for simplicity
        user_id = request.args.get('userId')
        if not user_id:
             return jsonify({"error": "User ID required"}), 400
             
        result = get_user_accounts(user_id)
        if 'error' in result:
             return jsonify(result), 500
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/accounts', methods=['POST'])
def add_account_route():
    try:
        data = request.json
        user_id = data.get('userId')
        phone_number = data.get('phoneNumber')
        session_string = data.get('sessionString')
        
        # Optional Telegram account details
        telegram_user_id = data.get('telegramUserId')
        telegram_username = data.get('telegramUsername')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        account_ownership = data.get('accountOwnership', 'user_owned')
        session_status = data.get('sessionStatus', 'active')
        
        if not all([user_id, phone_number, session_string]):
            return jsonify({"error": "Missing required fields"}), 400
            
        result = add_account(
            user_id, phone_number, session_string,
            telegram_user_id=telegram_user_id,
            telegram_username=telegram_username,
            first_name=first_name,
            last_name=last_name,
            account_ownership=account_ownership,
            session_status=session_status
        )
        if 'error' in result:
             return jsonify(result), 500
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/accounts/<account_id>', methods=['DELETE'])
def delete_account_route(account_id):
    try:
        user_id = request.args.get('userId') # Pass userId to verify ownership
        if not user_id:
             return jsonify({"error": "User ID required"}), 400
             
        result = delete_account(account_id, user_id)
        if 'error' in result:
             return jsonify(result), 400 # Or 404/403
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/send-dm', methods=['POST'])
def send_dm_route():
    """Send a direct message via Telegram"""
    try:
        data = request.json
        account_id = data.get('accountId')
        recipient = data.get('recipient')
        message = data.get('message')
        
        # Validation
        if not account_id:
            return jsonify({"error": "Account ID required"}), 400
        if not recipient:
            return jsonify({"error": "Recipient required"}), 400
        if not message:
            return jsonify({"error": "Message required"}), 400
        if len(message) > 4096:
            return jsonify({"error": "Message too long (max 4096 characters)"}), 400
        
        # Send the message
        result = send_dm(account_id, recipient, message)
        
        if result['status'] == 'success':
            return jsonify(result), 200
        else:
            # Error case
            status_code = 400
            if result['error_type'] == 'rate_limited':
                status_code = 429
            elif result['error_type'] == 'session_invalid':
                status_code = 401
            return jsonify(result), status_code
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "error_type": "unknown",
            "message": str(e)
        }), 500



UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/assets/config', methods=['GET'])
def get_asset_config():
    try:
        account_id = request.args.get('accountId')
        if not account_id:
            return jsonify({"error": "Account ID required"}), 400
            
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM model_assets WHERE account_id = ?', (account_id,))
        row = c.fetchone()
        conn.close()
        
        if row:
            return jsonify({
                "status": "success",
                "assets": dict(row)
            }), 200
        else:
            return jsonify({"status": "success", "assets": None}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/api/assets/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        account_id = request.form.get('accountId')
        asset_type = request.form.get('type') # 'face', 'room', 'opener'
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if not account_id:
             return jsonify({"error": "Account ID required"}), 400
             
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            
            # Create account specific folder: uploads/{account_id}/{asset_type}
            account_folder = os.path.join(app.config['UPLOAD_FOLDER'], str(account_id), asset_type)
            if not os.path.exists(account_folder):
                os.makedirs(account_folder)
                
            save_path = os.path.join(account_folder, filename)
            file.save(save_path)
            
            # Update Database
            # Relative path for serving: user_id/type/filename
            # Actually we served from uploads root, so path is account_id/type/filename
            relative_path = f"{account_id}/{asset_type}/{filename}"
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Check if exists
            c.execute('SELECT id, opener_images FROM model_assets WHERE account_id = ?', (account_id,))
            existing = c.fetchone()
            
            if asset_type == 'face':
                if existing:
                    c.execute('UPDATE model_assets SET model_face_ref = ? WHERE account_id = ?', (relative_path, account_id))
                else:
                    c.execute('INSERT INTO model_assets (user_id, account_id, model_face_ref) VALUES (?, ?, ?)', (1, account_id, relative_path)) # Hardcoded user_id=1
            
            elif asset_type == 'room':
                if existing:
                    c.execute('UPDATE model_assets SET room_bg_ref = ? WHERE account_id = ?', (relative_path, account_id))
                else:
                    c.execute('INSERT INTO model_assets (user_id, account_id, room_bg_ref) VALUES (?, ?, ?)', (1, account_id, relative_path))
            
            elif asset_type == 'opener':
                new_list = [relative_path]
                if existing and existing[1]:
                    try:
                        current_list = json.loads(existing[1])
                        current_list.append(relative_path)
                        new_list = current_list
                    except:
                        pass
                
                json_list = json.dumps(new_list)
                
                if existing:
                    c.execute('UPDATE model_assets SET opener_images = ? WHERE account_id = ?', (json_list, account_id))
                else:
                    c.execute('INSERT INTO model_assets (user_id, account_id, opener_images) VALUES (?, ?, ?)', (1, account_id, json_list))

            conn.commit()
            conn.close()

            return jsonify({
                "status": "success", 
                "path": relative_path,
                "filename": filename
            }), 200
        else:
            return jsonify({"error": "File type not allowed"}), 400

    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route('/api/assets/delete', methods=['DELETE'])
def delete_asset():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        data = request.json
        account_id = data.get('account_id')
        asset_type = data.get('type')
        filename = data.get('filename') # Just the filename, OR the full relative path

        if not account_id or not asset_type or not filename:
            return jsonify({"error": "Missing required fields"}), 400

        # Fetch current assets to verify and get path
        c.execute('SELECT id, model_face_ref, room_bg_ref, opener_images FROM model_assets WHERE account_id = ?', (account_id,))
        row = c.fetchone()

        if not row:
            return jsonify({"error": "Account assets not found"}), 404

        target_path = None
        db_update_needed = False

        # Logic to find the path and determine DB update
        if asset_type == 'face':
            if row[1] and filename in row[1]: # basic verification
                target_path = row[1]
                c.execute('UPDATE model_assets SET model_face_ref = NULL WHERE account_id = ?', (account_id,))
                db_update_needed = True

        elif asset_type == 'room':
            if row[2] and filename in row[2]:
                target_path = row[2]
                c.execute('UPDATE model_assets SET room_bg_ref = NULL WHERE account_id = ?', (account_id,))
                db_update_needed = True
        
        elif asset_type == 'opener':
            if row[3]:
                try:
                    openers = json.loads(row[3])
                    # Openers list contains paths. We need to find the one matching the filename or if the client sent the path
                    # Let's assume client sends the relative path for precision
                    if filename in openers:
                        target_path = filename
                        openers.remove(filename)
                        new_json = json.dumps(openers)
                        c.execute('UPDATE model_assets SET opener_images = ? WHERE account_id = ?', (new_json, account_id))
                        db_update_needed = True
                except:
                    pass

        if target_path and db_update_needed:
            conn.commit()
            
            # Delete from filesystem
            # target_path is like 'uploads/6/face/...'
            full_path = os.path.join(os.path.dirname(__file__), target_path)
            if os.path.exists(full_path):
                os.remove(full_path)
            
            conn.close()
            return jsonify({"status": "deleted"}), 200
        else:
            conn.close()
            return jsonify({"error": "Asset not found or already deleted"}), 404

    except Exception as e:
        if conn:
            conn.close()
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500

bot_process = None

@app.route('/api/bot/start', methods=['POST'])
def start_bot():
    global bot_process
    try:
        if bot_process and bot_process.poll() is None:
            return jsonify({"status": "already_running", "pid": bot_process.pid}), 200
        
        # Start the bot runner as a subprocess
        # We don't pipe stdout/stderr because we want it to run detached or inherit logs
        # And preventing buffer blocking if we don't read the pipes
        bot_runner_path = os.path.join(os.path.dirname(__file__), 'bot_runner.py')
        bot_process = subprocess.Popen([sys.executable, bot_runner_path])
        
        return jsonify({"status": "started", "pid": bot_process.pid}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/bot/stop', methods=['POST'])
def stop_bot():
    global bot_process
    try:
        if bot_process and bot_process.poll() is None:
            bot_process.terminate()
            bot_process.wait()
            bot_process = None
            return jsonify({"status": "stopped"}), 200
        else:
            return jsonify({"status": "not_running"}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/bot/status', methods=['GET'])
def get_bot_status():
    global bot_process
    try:
        is_running = bot_process is not None and bot_process.poll() is None
        return jsonify({
            "status": "running" if is_running else "stopped", 
            "pid": bot_process.pid if is_running else None
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/bot/logs', methods=['GET'])
def get_bot_logs():
    try:
        log_file = '/tmp/bot.log' if os.name != 'nt' else os.path.join(os.path.dirname(__file__), 'bot.log')
        if not os.path.exists(log_file):
            return jsonify({"logs": ["Log file not found at " + log_file]}), 200
            
        with open(log_file, 'r') as f:
            # Read last 100 lines
            lines = f.readlines()
            last_lines = lines[-100:]
            
        return jsonify({"logs": [line.strip() for line in last_lines]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
