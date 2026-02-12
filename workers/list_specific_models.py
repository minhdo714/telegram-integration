import requests
import json

try:
    response = requests.get('https://openrouter.ai/api/v1/models')
    data = response.json()
    
    models = []
    topics = ['cognitivecomputations', 'nousresearch', 'wizardlm', 'deepseek']
    for model in data.get('data', []):
        mid = model.get('id', '').lower()
        if any(t in mid for t in topics):
            models.append(mid)
    
    # Sort for easier reading
    models.sort()
    print(json.dumps(models, indent=2))
except Exception as e:
    print("Error:", e)
