
import requests

def get_model_details(model_id):
    try:
        # OpenRouter doesn't have a direct "per model" detail endpoint easily reachable, 
        # but the /models endpoint often includes some info or we can check the site data.
        # Actually, let's just look for the specific strings in all models.
        r = requests.get('https://openrouter.ai/api/v1/models')
        data = r.json().get('data', [])
        
        target = "dolphin"
        for m in data:
            if target in m['id'].lower() and '24b' in m['id'].lower():
                print(f"ID: {m['id']}")
                # Some models have multiple providers listed in the description or elsewhere in some API versions
                # but standard OpenRouter API /models returns the cheapest.
                # Let's see if there's any other dolphin 24b.
                input_p = float(m['pricing']['prompt']) * 1e6
                output_p = float(m['pricing']['completion']) * 1e6
                print(f"Price: ${input_p:.4f} / ${output_p:.4f}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    get_model_details('cognitivecomputations/dolphin-mistral-24b-venice-edition')
