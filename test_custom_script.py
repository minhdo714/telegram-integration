import requests
import time

url = "http://localhost:5000/api/send-dm"
headers = {"Content-Type": "application/json"}

def send_msg(msg):
    payload = {
        "accountId": "9",
        "recipient": "conexer714",
        "message": msg
    }
    try:
        print(f"Sending '{msg}'...")
        response = requests.post(url, json=payload, headers=headers)
        print(f"Response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# 1. Reset Session
send_msg("/reset")
time.sleep(2)

# 2. Trigger Opener
send_msg("hi")
print("Waiting for bot processing...")
