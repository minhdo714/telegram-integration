import requests
import json

try:
    response = requests.get('https://openrouter.ai/api/v1/models')
    data = response.json()
    
    models = []
    for model in data.get('data', []):
        mid = model.get('id', '')
        if 'dolphin' in mid.lower() or 'mistral' in mid.lower():
            models.append(mid)
    
    print(json.dumps(models, indent=2))
except Exception as e:
    print("Error:", e)
