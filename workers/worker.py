from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from telethon_handler import (
    initiate_qr_login,
    check_qr_status,
    request_sms_code,
    verify_sms_code,
    verify_2fa_password,
    validate_session
)

app = Flask(__name__)
CORS(app)  # Allow requests from Vercel

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "telegram-worker"}), 200

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
        
        if not phone_number:
            return jsonify({"error": "Phone number required"}), 400
        
        result = request_sms_code(phone_number)
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
        
        if not all([phone_number, code, phone_hash]):
            return jsonify({"error": "Missing required fields"}), 400
        
        result = verify_sms_code(phone_number, code, phone_hash)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sms-login/verify-password', methods=['POST'])
def sms_verify_password():
    try:
        data = request.json
        phone_number = data.get('phoneNumber')
        password = data.get('password')
        
        if not all([phone_number, password]):
            return jsonify({"error": "Missing required fields"}), 400
        
        result = verify_2fa_password(phone_number, password)
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
