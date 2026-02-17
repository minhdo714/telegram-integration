import requests
import json
import time

url = "http://localhost:5000/api/send-dm"
payload = {
    "accountId": "9",
    "recipient": "conexer714",
    "message": "send pic"
}
headers = {"Content-Type": "application/json"}

try:
    print("Sending 'send pic' message...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Response: {response.status_code} - {response.text}")
    
    # Wait for bot to process
    print("Waiting 10 seconds for bot processing...")
    time.sleep(10)
    
except Exception as e:
    print(f"Error: {e}")
