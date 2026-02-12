import requests
import json
import os

def list_models():
    try:
        response = requests.get('https://openrouter.ai/api/v1/models')
        response.raise_for_status()
        data = response.json()
        
        # Filter for models containing 'dolphin' or 'venice' or 'mixtral'
        relevant_models = []
        for model in data.get('data', []):
            mid = model.get('id', '').lower()
            if 'dolphin' in mid or 'venice' in mid or 'mixtral' in mid:
                relevant_models.append(model.get('id'))
        
        print(json.dumps(relevant_models, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
