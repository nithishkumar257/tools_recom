from __future__ import annotations

from collections import deque
from datetime import datetime
from threading import Lock
from typing import Any
from uuid import uuid4


_EVENTS: deque[dict[str, Any]] = deque(maxlen=500)
_LOCK = Lock()


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def publish_event(event_type: str, summary: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    event = {
        'id': str(uuid4()),
        'type': str(event_type or 'system.info'),
        'summary': str(summary or '').strip() or 'Event',
        'payload': payload or {},
        'created_at': _now(),
    }
    with _LOCK:
        _EVENTS.append(event)
    return event


def list_events(limit: int = 50) -> list[dict[str, Any]]:
    safe_limit = max(1, min(int(limit or 50), 200))
    with _LOCK:
        return list(_EVENTS)[-safe_limit:]
