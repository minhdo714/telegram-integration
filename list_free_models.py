
import requests

def list_free_models():
    try:
        r = requests.get('https://openrouter.ai/api/v1/models')
        data = r.json().get('data', [])
        free_models = [m['id'] for m in data if ':free' in m['id']]
        for model in free_models:
            print(model)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    list_free_models()
