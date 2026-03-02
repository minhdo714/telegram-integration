
import requests
import json

def list_dolphin():
    r = requests.get('https://openrouter.ai/api/v1/models')
    data = r.json().get('data', [])
    for m in data:
        if 'dolphin' in m['id'].lower():
            p = m.get('pricing', {})
            prompt = float(p.get('prompt', 0)) * 1e6
            comp = float(p.get('completion', 0)) * 1e6
            print(f"{m['id']} | Input: ${prompt:.4f} | Output: ${comp:.4f}")

if __name__ == '__main__':
    list_dolphin()
