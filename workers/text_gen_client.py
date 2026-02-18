import os
import logging
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

logger = logging.getLogger(__name__)

class TextGenClient:
    def __init__(self):
        self.provider = os.getenv('TEXT_GEN_PROVIDER', 'openai')
        self.api_key = None
        self.client = None
        self.model = None

        if self.provider == 'openai':
            self.api_key = os.getenv('OPENAI_API_KEY')
            self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
            if self.api_key:
                try:
                    from openai import OpenAI
                    self.client = OpenAI(api_key=self.api_key)
                    self.mode = 'live'
                    logger.info(f"TextGenClient: OpenAI Live Mode ({self.model})")
                except Exception as e:
                    logger.error(f"Failed to init OpenAI: {e}")
                    self.mode = 'mock'
            else:
                 self.mode = 'mock'
                 logger.warning("TextGenClient: Mock Mode (No OpenAI API Key)")

        elif self.provider == 'openrouter':
            self.api_key = os.getenv('OPENROUTER_API_KEY')
            self.model = os.getenv('OPENROUTER_MODEL', 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free')
            if self.api_key:
                try:
                    from openai import OpenAI
                    # OpenRouter uses the OpenAI client library with a custom base_url
                    self.client = OpenAI(
                        base_url="https://openrouter.ai/api/v1",
                        api_key=self.api_key,
                        default_headers={
                            "HTTP-Referer": "https://telegram-integration.local", # Replace with actual site URL
                            "X-Title": "Telegram Integration Bot",
                        }
                    )
                    self.mode = 'live'
                    logger.info(f"TextGenClient: OpenRouter Live Mode ({self.model})")
                except Exception as e:
                    logger.error(f"Failed to init OpenRouter: {e}")
                    self.mode = 'mock'
            else:
                self.mode = 'mock'
                logger.warning("TextGenClient: Mock Mode (No OpenRouter API Key)")
        
        elif self.provider == 'xai':
            self.api_key = os.getenv('XAI_API_KEY')
            self.model = os.getenv('XAI_MODEL', 'grok-4-1-fast-reasoning')
            if self.api_key:
                try:
                    from openai import OpenAI
                    self.client = OpenAI(
                        base_url="https://api.x.ai/v1",
                        api_key=self.api_key
                    )
                    self.mode = 'live'
                    logger.info(f"TextGenClient: x.AI Live Mode ({self.model})")
                except Exception as e:
                    logger.error(f"Failed to init x.AI: {e}")
                    self.mode = 'mock'
            else:
                self.mode = 'mock'
                logger.warning("TextGenClient: Mock Mode (No x.AI API Key)")

        else:
            self.mode = 'mock'
            logger.warning(f"TextGenClient: Unknown provider '{self.provider}', defaulting to Mock Mode")


    def generate_reply(self, history: List[Dict[str, str]], system_prompt: str, model: str = None) -> str:
        """
        Generate a reply based on conversation history.
        history: [{'role': 'user', 'content': '...'}, {'role': 'assistant', 'content': '...'}]
        """
        if self.mode == 'mock':
            # Simple mock logic based on last message
            last_msg = history[-1]['content'].lower() if history else ""
            
            if "hello" in last_msg or "hi" in last_msg:
                return "hey there! how are you doing today? 😊 (mock)"
            elif "joke" in last_msg:
                return "why did the scarecrow win an award? because he was outstanding in his field! 😂 (mock)"
            else:
                return "that's interesting! tell me more about that? (mock)"

        try:
            # LIVE API CALL
            messages = [{"role": "system", "content": system_prompt}] + history
            
            # Use provided model override or default
            target_model = model if model else self.model

            response = self.client.chat.completions.create(
                model=target_model,
                messages=messages,
                max_tokens=300, # Increased for articulated responses
                temperature=0.9 # High temperature for variety and creativity
            )
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"TextGen Error ({self.provider}): {e}")
            return "sorry, my brain is a bit slow today... what did you say again?"
