
import requests

def find_by_price():
    try:
        r = requests.get('https://openrouter.ai/api/v1/models')
        data = r.json().get('data', [])
        
        target_input = 0.04
        target_completion = 0.15
        
        for m in data:
            input_price = float(m['pricing']['prompt']) * 1e6
            output_price = float(m['pricing']['completion']) * 1e6
            
            # Check if pricing matches or is very close
            if abs(input_price - target_input) < 0.01 and abs(output_price - target_completion) < 0.01:
                print(f"ID: {m['id']}")
                print(f"Price: ${input_price:.4f} / ${output_price:.4f}")
                print(f"Description: {m.get('description', 'No description')[:200]}...")
                print("-" * 20)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    find_by_price()
