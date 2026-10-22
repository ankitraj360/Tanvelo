"""
Tanvelo Python SDK
Unified AI Gateway Client for OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, Ollama, and custom endpoints.
"""

import json
import os
import re
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


class ModelsResource:
    def __init__(self, client: "Tanvelo"):
        self._client = client

    def list(self, timeout: Optional[float] = None) -> List[Dict[str, Any]]:
        """List available models from the Tanvelo gateway."""
        url = f"{self._client.base_url}/models"
        req = urllib.request.Request(url)
        if self._client.api_key:
            req.add_header("Authorization", f"Bearer {self._client.api_key}")

        t = timeout if timeout is not None else self._client.timeout
        try:
            with urllib.request.urlopen(req, timeout=t) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("data", data) if isinstance(data, dict) else data
                result = []
                for m in items:
                    mid = m.get("id", "")
                    owned = m.get("owned_by") or m.get("provider") or (mid.split("/")[0] if "/" in mid else "openai")
                    result.append({
                        "id": mid,
                        "provider": owned,
                        "name": m.get("name", mid),
                        "object": m.get("object", "model"),
                        "created": m.get("created"),
                        "owned_by": m.get("owned_by"),
                    })
                return result
        except urllib.error.HTTPError as e:
            try:
                body = json.loads(e.read().decode("utf-8"))
                msg = body.get("error", {}).get("message") or body.get("message") or str(e)
            except Exception:
                msg = str(e)
            raise TanveloError(msg, status_code=e.code)
        except Exception as e:
            if isinstance(e, TanveloError):
                raise e
            raise TanveloError(str(e), status_code=500)


class ChatResource:
    def __init__(self, client: "Tanvelo"):
        self.completions = CompletionsResource(client)


class Tanvelo:
    """
    Tanvelo LLM Gateway Client.
    Usage:
        client = Tanvelo(api_key="tv_live_...", base_url="https://tanvelo-backend-zgyc.onrender.com/v1")
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
        raw_url = base_url or os.environ.get("TANVELO_BASE_URL", "https://tanvelo-backend-zgyc.onrender.com/v1")
        self.base_url = raw_url.rstrip("/")
        self.timeout = timeout
        self.chat = ChatResource(self)
        self.models = ModelsResource(self)

    def health(self, timeout: float = 5.0) -> Dict[str, Any]:
        """Check status of Tanvelo Gateway"""
        root_url = re.sub(r"/v1/?$", "", self.base_url)
        req = urllib.request.Request(f"{root_url}/health")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            return {"status": "offline", "error": str(e)}
