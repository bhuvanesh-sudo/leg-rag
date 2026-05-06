from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration
import requests


class GroqLLM(BaseChatModel):

    api_key: str

    @property
    def _llm_type(self) -> str:
        return "groq"

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):

        url = "https://api.groq.com/openai/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "user" if m.type == "human" else m.type,
                    "content": m.content
                }
                for m in messages
            ],
            "temperature": 0.2
        }

        res = requests.post(url, headers=headers, json=payload)

        if res.status_code != 200:
            raise Exception(res.text)

        content = res.json()["choices"][0]["message"]["content"]

        return ChatResult(
            generations=[
                ChatGeneration(
                    message=AIMessage(content=content)
                )
            ]
        )