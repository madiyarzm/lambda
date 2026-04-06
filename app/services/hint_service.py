"""
Hint generation service.

Returns a hint for a stuck student. When ANTHROPIC_API_KEY is set in the
environment, delegates to Claude (claude-haiku) for a personalized, code-aware
hint. Otherwise returns a generic placeholder so the feature works in demo mode
without any API key.

To enable AI hints:
    Add ANTHROPIC_API_KEY=sk-ant-... to your .env file and restart the server.
"""

import os

# Generic fallback hints cycled by attempt number (0-indexed).
_PLACEHOLDER_HINTS = [
    "Break the problem into smaller steps — what's the very first thing you need to compute?",
    "Double-check your logic with a simple example. Try tracing through your code line by line with a small input.",
    "Look at what your function is returning versus what's expected. A quick print() can help you see what's happening at each step.",
    "Sometimes the bug is in how you're reading the problem. Re-read the instructions and check edge cases like empty input or zero.",
    "You're close! Check variable names for typos, and make sure you're not accidentally overwriting a value inside your loop.",
]


def get_hint(*, code: str, description: str, attempt_number: int) -> str:
    """
    Return a hint string for the student.

    Args:
        code: The student's current code.
        description: The assignment description / instructions.
        attempt_number: How many failed attempts so far (1-indexed).

    Returns:
        A short hint string (plain text).
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if api_key:
        return _claude_hint(api_key, code=code, description=description, attempt_number=attempt_number)

    idx = max(0, min(attempt_number - 1, len(_PLACEHOLDER_HINTS) - 1))
    return _PLACEHOLDER_HINTS[idx]


def _claude_hint(api_key: str, *, code: str, description: str, attempt_number: int) -> str:
    """Call Claude Haiku to generate a context-aware hint."""
    try:
        import anthropic  # lazy import — only needed when API key is present
    except ImportError:
        return _PLACEHOLDER_HINTS[0] + " (Install the anthropic package to enable AI hints.)"

    client = anthropic.Anthropic(api_key=api_key)
    prompt = f"""You are an encouraging programming tutor helping a student who is stuck.

Assignment instructions:
{description or "(no description provided)"}

Student's current code (attempt #{attempt_number}):
```python
{code or "(empty)"}
```

Give a short hint (2–3 sentences max) that nudges them toward the solution without \
giving it away. Be specific to their code, not generic. Be warm and encouraging."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()
