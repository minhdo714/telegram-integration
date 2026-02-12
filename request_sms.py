import urllib.request
import json

url = "http://127.0.0.1:5000/api/sms-login/request-code"
data = {"phoneNumber": "+17143329798"}
headers = {"Content-Type": "application/json"}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Error: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {str(e)}")
