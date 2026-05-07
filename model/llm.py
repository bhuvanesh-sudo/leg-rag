"""
llm.py — Groq LLM wrapper (BaseChatModel) hitting llama-3.1-8b-instant.
Kept explicit so API call logic is transparent and easy to swap.
"""

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration
import requests


class GroqLLM(BaseChatModel):
    api_key: str
    model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.1

    @property
    def _llm_type(self) -> str:
        return "groq"

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user" if m.type == "human" else m.type,
                    "content": m.content,
                }
                for m in messages
            ],
            "temperature": self.temperature,
        }
        res = requests.post(url, headers=headers, json=payload, timeout=60)
        if res.status_code != 200:
            raise Exception(f"Groq API error {res.status_code}: {res.text}")
        content = res.json()["choices"][0]["message"]["content"]
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
