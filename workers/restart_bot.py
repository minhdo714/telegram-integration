import requests
import time

print("Stopping bot...")
try:
    response = requests.post('http://localhost:5000/api/bot/stop', timeout=5)
    print(f"Stop response: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"Stop error: {e}")

time.sleep(2)

print("\nStarting bot...")
try:
    response = requests.post('http://localhost:5000/api/bot/start', timeout=5)
    print(f"Start response: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"Start error: {e}")

time.sleep(3)

print("\nChecking bot status...")
try:
    response = requests.get('http://localhost:5000/api/bot/status', timeout=5)
    print(f"Status response: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"Status error: {e}")
