import requests
import json

def test_sms_request():
    url = "http://localhost:5000/api/sms-login/request-code"
    # Use a dummy number that is valid format but likely to fail at Telegram side or mock side
    payload = {
        "phoneNumber": "+1234567890" 
    }
    
    print(f"Sending POST request to {url} with payload: {payload}")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_sms_request()
