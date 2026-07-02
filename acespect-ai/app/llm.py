"""Thin wrapper over the official Anthropic SDK.

Each agent does a single-shot *structured* call: we expose one tool whose
input_schema is the agent's Pydantic schema and force Claude to call it
(`tool_choice` = that tool), then read the typed `input` back. This is the most
reliable way to get schema-valid JSON out of any model.
"""
from __future__ import annotations
import time
from typing import Any

from anthropic import Anthropic

from .config import settings

# One shared client for the process. None in stub mode (no key).
_client: Anthropic | None = Anthropic(api_key=settings.anthropic_api_key) if not settings.stub_mode else None


def structured_call(
    *,
    model: str,
    system: str,
    content: list[dict[str, Any]],
    tool_name: str,
    schema: dict[str, Any],
    max_tokens: int = 2048,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Run one structured extraction. Returns (parsed_output, run_metadata)."""
    assert _client is not None, "structured_call must not run in stub mode"
    start = time.time()
    resp = _client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        tools=[
            {
                "name": tool_name,
                "description": f"Record the {tool_name} result. You MUST call this tool.",
                "input_schema": schema,
            }
        ],
        tool_choice={"type": "tool", "name": tool_name},
        messages=[{"role": "user", "content": content}],
    )

    data: dict[str, Any] = {}
    for block in resp.content:
        if block.type == "tool_use" and block.name == tool_name:
            data = dict(block.input)  # type: ignore[arg-type]
            break

    meta = {
        "model": model,
        "tokensUsed": resp.usage.input_tokens + resp.usage.output_tokens,
        "latencyMs": int((time.time() - start) * 1000),
    }
    return data, meta
