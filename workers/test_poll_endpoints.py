import requests
import os
from dotenv import load_dotenv

load_dotenv('../.env')

API_KEY = os.getenv('KIE_API_KEY')
task_id = "3506975e3fa58d8790ed86270aaa0f28"  # From previous test
headers = {"Authorization": f"Bearer {API_KEY}"}

print("Testing different polling endpoints for task ID:", task_id)
print("="*70)

endpoints = [
    f"https://api.kie.ai/api/v1/jobs/getTask/{task_id}",  # Current (fails)
    f"https://api.kie.ai/api/v1/jobs/{task_id}",
    f"https://api.kie.ai/api/v1/tasks/{task_id}",
    f"https://api.kie.ai/api/v1/job/{task_id}",
    f"https://api.kie.ai/api/v1/task/{task_id}",
    f"https://api.kie.ai/api/v1/getTask/{task_id}",
    f"https://kieai.redpandaai.co/api/jobs/getTask/{task_id}",
    f"https://kieai.redpandaai.co/api/v1/jobs/getTask/{task_id}",
]

for endpoint in endpoints:
    print(f"\nTrying: {endpoint}")
    try:
        response = requests.get(endpoint, headers=headers, timeout=5)
        print(f"  Status: {response.status_code}")
        if response.ok:
            print(f"  ✓ SUCCESS!")
            print(f"  Response: {response.json()}")
            break
        else:
            print(f"  Error: {response.text[:100]}")
    except Exception as e:
        print(f"  Exception: {e}")
