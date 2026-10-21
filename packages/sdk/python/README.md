# Tanvelo Python SDK

Official Python client for the Tanvelo LLM Federation Gateway.

## Installation

```bash
pip install tanvelo
```

## Quickstart

```python
from tanvelo import Tanvelo

client = Tanvelo(
    api_key="your_tanvelo_api_key",
    base_url="https://tanvelo-backend-zgyc.onrender.com/v1"
)

# Chat completion with automatic routing and fallbacks
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello Tanvelo!"}],
    fallbacks=["claude-3-5-sonnet", "gemini-1.5-pro"]
)

print(response.content)
```
