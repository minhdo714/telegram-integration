
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
headers = {"Authorization": f"Bearer {api_key}"}

# 1x1 white JPEG base64 (without prefix for upload if needed, or with)
base64_img_raw = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
base64_img_data = f"data:image/jpeg;base64,{base64_img_raw}"

def upload_image():
    # Use the endpoint found in search
    url = "https://kieai.redpandaai.co/api/file-base64-upload"
    
    # Try valid payload structure from search (JSON body with base64Data)
    payload = {
        "base64Data": base64_img_data 
    }
    
    print(f"Uploading to {url}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Upload Status: {response.status_code}")
        print(f"Upload Response: {response.text}")
        if response.ok:
            data = response.json().get('data', {})
            return data.get('url') # Assuming it returns 'url'
    except Exception as e:
        print(f"Upload Error: {e}")
    return None

def create_edit_task(image_url):
    url = "https://api.kie.ai/api/v1/jobs/createTask"
    payload = {
        "model": "seedream/4.5-edit",
        "input": {
            "prompt": "Change to blue",
            "image_urls": [image_url]
        }
    }
    print(f"\nCreating Task with URL: {image_url}")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Task Status: {response.status_code}")
        print(f"Task Response: {response.text}")
        if response.ok:
            return response.json().get('data', {}).get('taskId')
    except Exception as e:
        print(f"Task Error: {e}")

img_url = upload_image()
if img_url:
    print(f"Got Image URL: {img_url}")
    create_edit_task(img_url)
else:
    print("Upload failed.")
