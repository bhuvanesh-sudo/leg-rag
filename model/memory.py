"""
memory.py — Lightweight in-process conversation memory per session.

Stores (role, content) pairs keyed by session_id.
No external dependency — just a dict. Swap for Redis if you need persistence.
"""

from __future__ import annotations
from collections import defaultdict

MAX_TURNS = 10  # keep last N exchanges to avoid bloating the context window

_store: dict[str, list[dict]] = defaultdict(list)


def add_turn(session_id: str, role: str, content: str) -> None:
    """Append a turn. role = 'user' | 'assistant'."""
    _store[session_id].append({"role": role, "content": content})
    # Trim to last MAX_TURNS exchanges (each exchange = 2 turns)
    if len(_store[session_id]) > MAX_TURNS * 2:
        _store[session_id] = _store[session_id][-(MAX_TURNS * 2):]


def get_history(session_id: str) -> list[dict]:
    return list(_store[session_id])


def format_history(session_id: str) -> str:
    """Format history as a readable string for prompt injection."""
    turns = get_history(session_id)
    if not turns:
        return "(no previous conversation)"
    lines = []
    for t in turns:
        prefix = "User" if t["role"] == "user" else "Assistant"
        lines.append(f"{prefix}: {t['content']}")
    return "\n".join(lines)


def clear_session(session_id: str) -> None:
    _store.pop(session_id, None)


def list_sessions() -> list[str]:
    return list(_store.keys())
