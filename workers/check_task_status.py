import requests
import os
from dotenv import load_dotenv

load_dotenv('../.env')

API_KEY = os.getenv('KIE_API_KEY')

# Check the actual task status from the recent generation
task_id = "8aee6c6e4fda28e5af1515012093da8a"

url = f"https://api.kie.ai/api/v1/jobs/getTask/{task_id}"
headers = {"Authorization": f"Bearer {API_KEY}"}

response = requests.get(url, headers=headers)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
