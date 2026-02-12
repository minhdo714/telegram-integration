import os
import requests
import base64
import json
import time
import io
import sys
from PIL import Image

# Mock settings just in case, but we need real API key
API_KEY = os.getenv('KIE_API_KEY')

# Write to file
def print_flush(msg):
    print(msg)
    with open("results.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")

if not API_KEY:
    print_flush("Error: KIE_API_KEY not found in env.")

BASE_URL = "https://api.kie.ai/api/v1"

def poll_task(task_id, headers):
    url = f"{BASE_URL}/jobs/getTask/{task_id}"
    print_flush(f"Polling task {task_id}...")
    for _ in range(30):
        try:
            resp = requests.get(url, headers=headers)
            if resp.ok:
                data = resp.json().get('data') or {}
                status = data.get('status')
                if status == 'SUCCEEDED':
                    return data
                elif status == 'FAILED':
                    print_flush(f"Task Failed: {data}")
                    return None
            time.sleep(2)
        except Exception as e:
            print_flush(f"Polling error: {e}")
            time.sleep(2)
    print_flush("Polling timeout")
    return None

def test_upload_and_gen():
    print_flush("--- Testing Upload ---")
    # Create a small dummy image (red square)
    img = Image.new('RGB', (100, 100), color = 'red')
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    img_bytes = buffer.getvalue()
    base64_data = base64.b64encode(img_bytes).decode('utf-8')
    
    # Upload
    url = "https://kieai.redpandaai.co/api/file-base64-upload"
    payload = {
        "base64Data": f"data:image/jpeg;base64,{base64_data}",
        "fileName": "test_red_square.jpg",
        "uploadPath": "debug_test"
    }
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    file_path = None
    public_url = None
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        print_flush(f"Upload Status: {resp.status_code}")
        print_flush(f"Upload Response: {resp.text}")
        
        upload_json = resp.json()
        file_path = upload_json.get('data', {}).get('filePath')
        public_url = upload_json.get('data', {}).get('url')
        print_flush(f"Upload URL: {public_url}")
        print_flush(f"Upload FilePath: {file_path}")
        
    except Exception as e:
        print_flush(f"Upload failed: {e}")
        return

    print_flush("\n--- Testing Generation (Deep Verification) ---")
    gen_url = f"{BASE_URL}/jobs/createTask"
    
    # Create PNG Base64
    buffer_png = io.BytesIO()
    img.save(buffer_png, format="PNG")
    base64_png = base64.b64encode(buffer_png.getvalue()).decode('utf-8')
    prefix_png = f"data:image/png;base64,{base64_png}"
    
    # 1. Test Public URL (Control)
    public_test_url = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
    
    tests = []
    
    # Public URL
    tests.append(("Real Public URL", "seedream/4.5-edit", "image_urls", [public_test_url]))
    
    # Base64
    tests.append(("Base64 PNG Prefix", "seedream/4.5-edit", "image_urls", [prefix_png]))
    
    # Upload URL (Internal?)
    if public_url:
        tests.append(("Upload URL List", "seedream/4.5-edit", "image_urls", [public_url]))
        
    # FilePath (Internal)
    if file_path:
        tests.append(("Upload FilePath List", "seedream/4.5-edit", "image_urls", [file_path]))
        
    
    for name, model, key, val in tests:
        print_flush(f"\nTest: {name} | Model: {model} | Key: {key}")
        
        gen_payload = {
            "model": model,
            "input": {
                "prompt": "Make it blue",
                "aspect_ratio": "1:1"
            }
        }
        gen_payload["input"][key] = val
        
        try:
            resp = requests.post(gen_url, headers=headers, json=gen_payload)
            print_flush(f"Status: {resp.status_code}")
            
            try:
                data = resp.json().get('data') 
                msg = resp.json().get('msg')
            except:
                data, msg = None, resp.text
            
            print_flush(f"Msg: {msg}")
            
            task_id = data.get('taskId') if data else None
            if task_id:
                print_flush(f"SUCCESS! Task ID: {task_id}")
                return # Stop on first success
                
        except Exception as e:
            print_flush(f"Exception: {e}")

if __name__ == "__main__":
    test_upload_and_gen()
