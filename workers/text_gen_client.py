import os
import logging
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

logger = logging.getLogger(__name__)

class TextGenClient:
    def __init__(self):
        self.mode = None
        self.primary_provider = os.getenv('TEXT_GEN_PROVIDER', 'openai')
        self.clients = {}  # Store initialized clients: {provider: (client_obj, model_name)}
        self.available_providers = [] # List of providers that are successfully initialized

        # 1. Initialize OpenAI
        openai_key = os.getenv('OPENAI_API_KEY')
        openai_model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        if openai_key:
            try:
                from openai import OpenAI
                self.clients['openai'] = (OpenAI(api_key=openai_key), openai_model)
                self.available_providers.append('openai')
                logger.info(f"TextGenClient: OpenAI Initialized ({openai_model})")
            except Exception as e:
                logger.error(f"Failed to init OpenAI: {e}")

        # 2. Initialize OpenRouter
        or_key = os.getenv('OPENROUTER_API_KEY')
        or_model = os.getenv('OPENROUTER_MODEL', 'nousresearch/hermes-3-llama-3.1-405b')
        if or_key:
            try:
                from openai import OpenAI
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=or_key,
                    default_headers={
                        "HTTP-Referer": "https://telegram-integration.local",
                        "X-Title": "Telegram Integration Bot",
                    }
                )
                self.clients['openrouter'] = (client, or_model)
                self.available_providers.append('openrouter')
                logger.info(f"TextGenClient: OpenRouter Initialized ({or_model})")
            except Exception as e:
                logger.error(f"Failed to init OpenRouter: {e}")

        # 3. Initialize xAI (Grok)
        xai_key = os.getenv('XAI_API_KEY')
        xai_model = os.getenv('XAI_MODEL', 'grok-4-1-fast-reasoning')
        if xai_key:
            try:
                from openai import OpenAI
                client = OpenAI(
                    base_url="https://api.x.ai/v1",
                    api_key=xai_key
                )
                self.clients['xai'] = (client, xai_model)
                self.available_providers.append('xai')
                logger.info(f"TextGenClient: xAI Initialized ({xai_model})")
            except Exception as e:
                logger.error(f"Failed to init xAI: {e}")

        # 4. Initialize Infermatic.ai
        inf_key = os.getenv('INFERMATIC_API_KEY')
        inf_model = os.getenv('INFERMATIC_MODEL', 'sao10k/l3.3-euryale-70b-v2.3')
        if inf_key:
            try:
                from openai import OpenAI
                client = OpenAI(
                    base_url="https://api.totalgpt.ai/v1",
                    api_key=inf_key
                )
                self.clients['infermatic'] = (client, inf_model)
                self.available_providers.append('infermatic')
                logger.info(f"TextGenClient: Infermatic Initialized ({inf_model})")
            except Exception as e:
                logger.error(f"Failed to init Infermatic: {e}")

        # Set final mode
        if not self.available_providers:
            self.mode = 'mock'
            logger.warning("TextGenClient: Mock Mode (No valid API providers found)")
        else:
            self.mode = 'live'
            # Ensure primary provider is in front if available, or just use what we have
            if self.primary_provider in self.available_providers:
                # Move primary to front
                self.available_providers.remove(self.primary_provider)
                self.available_providers.insert(0, self.primary_provider)
            
            # Set default model for backward compatibility
            primary = self.available_providers[0]
            _, self.model = self.clients[primary]

            logger.info(f"TextGenClient: Live Mode. Priority: {self.available_providers}")


    def generate_reply(self, history: List[Dict[str, str]], system_prompt: str, model: str = None) -> str:
        """
        Generate a reply based on conversation history with automatic fallback.
        Includes retry logic with exponential backoff.
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

        # Iterate through available providers in order of priority
        last_error = None
        primary_provider = self.available_providers[0] if self.available_providers else None
        for provider_name in self.available_providers:
            client, default_model = self.clients[provider_name]
            # Only apply the custom model override on the primary provider.
            # Fallback providers must use their own default model — passing an
            # xAI model name to OpenRouter (or vice-versa) causes an instant failure
            # which trips the fallback loop and results in the static placeholder response.
            if provider_name == primary_provider:
                target_model = model if model else default_model
            else:
                target_model = default_model

            # Retry logic: try up to 2 times per provider
            for attempt in range(2):
                try:
                    messages = [{"role": "system", "content": system_prompt}] + history
                    # Add timeout: 45 seconds to give APIs enough time
                    response = client.chat.completions.create(
                        model=target_model,
                        messages=messages,
                        max_tokens=120,
                        temperature=0.9,
                        timeout=45
                    )
                    return response.choices[0].message.content.strip()
                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()
                    
                    # Log specific error types
                    if "429" in str(e) or "exhausted" in error_str:
                        logger.warning(f"Provider {provider_name} rate limited. Trying next...")
                        break  # Skip to next provider if rate limited
                    elif "timeout" in error_str or "deadline" in error_str:
                        if attempt < 1:
                            logger.info(f"Provider {provider_name} timeout. Retrying... (attempt {attempt + 1}/2)")
                            continue  # Retry same provider
                        else:
                            logger.warning(f"Provider {provider_name} timeout after retries. Trying next...")
                            break  # Skip to next provider
                    else:
                        logger.error(f"TextGen Error ({provider_name}, attempt {attempt + 1}): {e}")
                        if attempt < 1:
                            continue  # Retry same provider
                        break  # Skip to next provider

        # If we reached here, ALL providers failed
        logger.critical(f"All AI providers failed. Last Error: {last_error}")
        # Fallback to a generic engaging response instead of apologizing
        fallback_responses = [
            "You got my attention 👀 Tell me more...",
            "Hmm, interesting... go on 😊",
            "I'm all ears! What's up? 💭",
            "You're intriguing me... continue 😏",
            "Got me curious here... what is it? 🤔"
        ]
        import random
        return random.choice(fallback_responses)
