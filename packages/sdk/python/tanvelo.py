"""
Tanvelo Python SDK
Unified AI Gateway Client for OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, Ollama, and custom endpoints.
"""

import json
import os
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional, Iterator, Union


class TanveloError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class ChatMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    def to_dict(self) -> Dict[str, str]:
        return {"role": self.role, "content": self.content}


class ChatChoice:
    def __init__(self, data: Dict[str, Any]):
        self.index = data.get("index", 0)
        msg = data.get("message", {})
        self.message = ChatMessage(msg.get("role", "assistant"), msg.get("content", ""))
        self.finish_reason = data.get("finish_reason")


class ChatUsage:
    def __init__(self, data: Dict[str, Any]):
        self.prompt_tokens = data.get("prompt_tokens", 0)
        self.completion_tokens = data.get("completion_tokens", 0)
        self.total_tokens = data.get("total_tokens", 0)


class ChatCompletion:
    def __init__(self, data: Dict[str, Any], headers: Optional[Dict[str, str]] = None):
        self.id = data.get("id", "")
        self.model = data.get("model", "")
        self.created = data.get("created", 0)
        self.choices = [ChatChoice(c) for c in data.get("choices", [])]
        self.usage = ChatUsage(data.get("usage", {})) if "usage" in data else None
        self._raw = data
        self.headers = headers or {}

    @property
    def content(self) -> str:
        """Helper to quickly access the primary message response text"""
        if self.choices and self.choices[0].message:
            return self.choices[0].message.content
        return ""

    def __repr__(self) -> str:
        return f"<ChatCompletion id={self.id} model={self.model} choices={len(self.choices)}>"


class ChatChunkDelta:
    def __init__(self, data: Dict[str, Any]):
        self.role = data.get("role")
        self.content = data.get("content", "")


class ChatChunkChoice:
    def __init__(self, data: Dict[str, Any]):
        self.index = data.get("index", 0)
        self.delta = ChatChunkDelta(data.get("delta", {}))
        self.finish_reason = data.get("finish_reason")


class ChatCompletionChunk:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id", "")
        self.model = data.get("model", "")
        self.created = data.get("created", 0)
        self.choices = [ChatChunkChoice(c) for c in data.get("choices", [])]

    @property
    def delta(self) -> str:
        """Helper to quickly get streamed chunk delta text"""
        if self.choices and self.choices[0].delta:
            return self.choices[0].delta.content or ""
        return ""


class CompletionsResource:
    def __init__(self, client: "Tanvelo"):
        self.client = client

    def create(
        self,
        model: str,
        messages: List[Union[Dict[str, str], ChatMessage]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        fallbacks: Optional[List[str]] = None,
        **kwargs
    ) -> Union[ChatCompletion, Iterator[ChatCompletionChunk]]:
        """
        Create a chat completion through Tanvelo Gateway.
        Route to any supported model: 'gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro',
        'deepseek/deepseek-chat', 'ollama/llama3.1', etc.
        """
        payload: Dict[str, Any] = {
            "model": model,
            "messages": [
                m.to_dict() if isinstance(m, ChatMessage) else m
                for m in messages
            ],
            "stream": stream,
        }
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if kwargs:
            payload.update(kwargs)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Tanvelo-Python-SDK/1.0",
        }
        if self.client.api_key:
            headers["Authorization"] = f"Bearer {self.client.api_key}"
        if fallbacks:
            headers["X-Tanvelo-Fallbacks"] = ",".join(fallbacks)

        url = f"{self.client.base_url}/chat/completions"
        data_bytes = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        try:
            resp = urllib.request.urlopen(req, timeout=self.client.timeout)
        except urllib.error.HTTPError as e:
            err_content = e.read().decode("utf-8", errors="ignore")
            try:
                err_json = json.loads(err_content)
                msg = err_json.get("error", {}).get("message") or err_json.get("error") or err_content
            except Exception:
                msg = err_content or str(e)
            raise TanveloError(f"HTTP {e.code}: {msg}", status_code=e.code, response_body=err_content)
        except urllib.error.URLError as e:
            raise TanveloError(f"Connection failed: {e.reason}")

        if stream:
            return self._stream_generator(resp)

        resp_text = resp.read().decode("utf-8")
        resp_json = json.loads(resp_text)
        return ChatCompletion(resp_json, headers=dict(resp.headers))

    def _stream_generator(self, resp) -> Iterator[ChatCompletionChunk]:
        """Parse SSE stream from gateway"""
        try:
            for line in resp:
                line_str = line.decode("utf-8", errors="ignore").strip()
                if not line_str or line_str.startswith(":"):
                    continue
                if line_str.startswith("data:"):
                    data_part = line_str[5:].strip()
                    if data_part == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_part)
                        yield ChatCompletionChunk(chunk_json)
                    except Exception:
                        continue
        finally:
            resp.close()


class ChatResource:
    def __init__(self, client: "Tanvelo"):
        self.completions = CompletionsResource(client)


class Tanvelo:
    """
    Tanvelo LLM Gateway Client.
    Usage:
        client = Tanvelo(api_key="tanvelo_live_...", base_url="http://localhost:4000/v1")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello!"}]
        )
        print(response.content)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 60.0
    ):
        self.api_key = api_key or os.environ.get("TANVELO_API_KEY", "")
        raw_url = base_url or os.environ.get("TANVELO_BASE_URL", "http://localhost:4000/v1")
        self.base_url = raw_url.rstrip("/")
        self.timeout = timeout
        self.chat = ChatResource(self)

    def health(self) -> Dict[str, Any]:
        """Check status of Tanvelo Gateway"""
        root_url = self.base_url.replace("/v1", "")
        req = urllib.request.Request(f"{root_url}/health")
        try:
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            return {"status": "offline", "error": str(e)}
