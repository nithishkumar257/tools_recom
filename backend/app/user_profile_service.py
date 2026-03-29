from __future__ import annotations

from threading import Lock
from typing import Any

from .cache_service import invalidate_cache
from .event_service import publish_event


_PREFERENCES_BY_USER: dict[str, dict[str, Any]] = {}
_LOCK = Lock()


def _default_preferences() -> dict[str, Any]:
    return {
        'preferred_categories': [],
        'budget_mode': 'mixed',
        'skill_level': 'intermediate',
        'notifications_enabled': True,
        'opt_in_personalization': True,
    }


def _normalize_categories(value: Any) -> list[str]:
    if isinstance(value, str):
        parts = [part.strip() for part in value.split(',')]
    elif isinstance(value, list):
        parts = [str(part).strip() for part in value]
    else:
        parts = []

    categories: list[str] = []
    seen: set[str] = set()
    for part in parts:
        if not part:
            continue
        key = part.lower()
        if key in seen:
            continue
        seen.add(key)
        categories.append(part)

    return categories[:8]


def _normalize_preferences(payload: dict[str, Any] | None) -> dict[str, Any]:
    data = payload or {}
    defaults = _default_preferences()

    budget_mode = str(data.get('budget_mode', defaults['budget_mode'])).strip().lower()
    if budget_mode not in {'free', 'mixed', 'premium'}:
        budget_mode = defaults['budget_mode']

    skill_level = str(data.get('skill_level', defaults['skill_level'])).strip().lower()
    if skill_level not in {'beginner', 'intermediate', 'advanced'}:
        skill_level = defaults['skill_level']

    return {
        'preferred_categories': _normalize_categories(data.get('preferred_categories', defaults['preferred_categories'])),
        'budget_mode': budget_mode,
        'skill_level': skill_level,
        'notifications_enabled': bool(data.get('notifications_enabled', defaults['notifications_enabled'])),
        'opt_in_personalization': bool(data.get('opt_in_personalization', defaults['opt_in_personalization'])),
    }


def get_user_profile_preferences(user: dict[str, Any]) -> dict[str, Any]:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        return _default_preferences()

    with _LOCK:
        prefs = _PREFERENCES_BY_USER.get(user_id)

    if not prefs:
        return _default_preferences()
    return dict(prefs)


def update_user_profile_preferences(user: dict[str, Any], payload: dict[str, Any] | None) -> dict[str, Any]:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        raise ValueError('User identifier is missing.')

    normalized = _normalize_preferences(payload)
    with _LOCK:
        _PREFERENCES_BY_USER[user_id] = normalized

    invalidate_cache(f'feed:{user_id}:')
    invalidate_cache(f'notifications:{user_id}:')

    publish_event(
        'profile.preferences.updated',
        'User profile preferences updated',
        {
            'user_id': user_id,
            'preferred_categories_count': len(normalized.get('preferred_categories') or []),
            'budget_mode': normalized.get('budget_mode'),
            'skill_level': normalized.get('skill_level'),
        },
    )

    return dict(normalized)