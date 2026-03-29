from __future__ import annotations

import json
import time
from threading import Lock
from typing import Any


_CACHE: dict[str, dict[str, Any]] = {}
_LOCK = Lock()
_MAX_ITEMS = 2000


def make_cache_key(prefix: str, payload: dict[str, Any] | None = None) -> str:
    data = payload or {}
    serialized = json.dumps(data, sort_keys=True, default=str, separators=(',', ':'))
    return f'{prefix}:{serialized}'


def get_cached(key: str) -> Any | None:
    now = time.time()
    with _LOCK:
        entry = _CACHE.get(key)
        if not entry:
            return None

        expires_at = float(entry.get('expires_at') or 0)
        if expires_at <= now:
            _CACHE.pop(key, None)
            return None

        return entry.get('value')


def set_cached(key: str, value: Any, ttl_seconds: int = 60) -> None:
    ttl = max(1, int(ttl_seconds or 60))
    now = time.time()
    with _LOCK:
        if len(_CACHE) >= _MAX_ITEMS:
            expired = [cache_key for cache_key, entry in _CACHE.items() if float(entry.get('expires_at') or 0) <= now]
            for cache_key in expired[:500]:
                _CACHE.pop(cache_key, None)

            if len(_CACHE) >= _MAX_ITEMS:
                oldest_keys = sorted(_CACHE.keys(), key=lambda cache_key: float(_CACHE[cache_key].get('created_at') or now))[:250]
                for cache_key in oldest_keys:
                    _CACHE.pop(cache_key, None)

        _CACHE[key] = {
            'value': value,
            'created_at': now,
            'expires_at': now + ttl,
        }


def invalidate_cache(prefix: str | None = None) -> int:
    with _LOCK:
        if not prefix:
            count = len(_CACHE)
            _CACHE.clear()
            return count

        targets = [cache_key for cache_key in _CACHE.keys() if cache_key.startswith(prefix)]
        for cache_key in targets:
            _CACHE.pop(cache_key, None)
        return len(targets)


def cache_stats() -> dict[str, Any]:
    now = time.time()
    with _LOCK:
        total = len(_CACHE)
        active = sum(1 for entry in _CACHE.values() if float(entry.get('expires_at') or 0) > now)
        expired = total - active
    return {
        'total_keys': total,
        'active_keys': active,
        'expired_keys': expired,
        'max_items': _MAX_ITEMS,
    }