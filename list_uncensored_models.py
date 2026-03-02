
import requests

def final_check():
    try:
        r = requests.get('https://openrouter.ai/api/v1/models')
        data = r.json().get('data', [])
        
        for m in data:
            mid = m['id'].lower()
            if ('24b' in mid or '26b' in mid) and 'mistral' in mid:
                input_p = float(m['pricing']['prompt']) * 1e6
                output_p = float(m['pricing']['completion']) * 1e6
                print(f"ID: {m['id']} | Price: ${input_p:.4f} / ${output_p:.4f}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    final_check()
