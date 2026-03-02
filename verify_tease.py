
import requests
import json
import time

def test_tease_generation():
    url = "http://localhost:5000/api/bot/tease"
    
    # Mock data
    payload = {
        "accountId": 1, # Ensure this ID exists or use a valid one
        "recipient": "test_user",
        "leadName": "TestUser",
        "groupName": "TestGroup"
    }
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("\n✅ Verification Successful: Backend accepted the job.")
            print("Check 'worker.log' or the console to see if the image generation and sending (mock) proceeds.")
        else:
            print("\n❌ Verification Failed")
            
    except Exception as e:
        print(f"\n❌ Connection Refused: Is the backend running? ({e})")

if __name__ == "__main__":
    test_tease_generation()
