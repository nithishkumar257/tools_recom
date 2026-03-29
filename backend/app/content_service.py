from __future__ import annotations

from datetime import datetime
from typing import Any

from .catalog_service import FALLBACK_TOOLS, list_tools
from .db import db_state, execute, query_all
from .event_service import publish_event


_content_state: dict[str, Any] = {
    'last_refresh_at': None,
    'last_batch_size': 0,
    'total_refreshed_count': 0,
}


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _summarize(text: str, max_len: int = 140) -> str:
    cleaned = ' '.join((text or '').split())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 3].rstrip() + '...'


def refresh_content(payload: dict[str, Any] | None = None) -> dict:
    data = payload or {}
    requested = int(data.get('count', 20))
    batch_size = max(1, min(requested, 100))

    if db_state.enabled:
        rows = query_all(
            '''
            SELECT id, name, description_short, description_long, metadata
            FROM tools
            WHERE is_active = TRUE
            ORDER BY updated_at DESC, popularity_score DESC
            LIMIT %s
            ''',
            (batch_size,),
        )

        updated_items: list[dict[str, Any]] = []
        for row in rows:
            short_text = row.get('description_short') or row.get('description_long') or ''
            long_text = row.get('description_long') or row.get('description_short') or ''

            next_short = _summarize(short_text or f"{row.get('name', 'Tool')} helps with AI workflows.", 140)
            next_long = _summarize(long_text or next_short, 280)

            metadata = row.get('metadata') or {}
            metadata['content_refreshed_at'] = _now()

            execute(
                '''
                UPDATE tools
                SET description_short = %s,
                    description_long = %s,
                    metadata = %s::jsonb,
                    updated_at = NOW()
                WHERE id = %s::uuid
                ''',
                (next_short, next_long, metadata, row['id']),
            )

            updated_items.append(
                {
                    'name': row.get('name'),
                    'description_short': next_short,
                }
            )

        _content_state['last_refresh_at'] = _now()
        _content_state['last_batch_size'] = len(updated_items)
        _content_state['total_refreshed_count'] += len(updated_items)

        publish_event(
            'content.refresh.completed',
            'Content refresh completed',
            {
                'updated_count': len(updated_items),
                'total_refreshed_count': _content_state['total_refreshed_count'],
            },
        )

        return {
            'updated_count': len(updated_items),
            'updated_items': updated_items[:20],
            'state': dict(_content_state),
        }

    tools = list_tools({'limit': batch_size, 'sort': 'updated'}).get('items', [])
    fallback_index = {item['id']: item for item in FALLBACK_TOOLS}
    updated_items: list[dict[str, Any]] = []

    for item in tools:
        base = fallback_index.get(item['id'])
        if not base:
            continue

        next_description = _summarize(base.get('description') or f"{base.get('name', 'Tool')} helps with AI workflows.", 140)
        base['description'] = next_description
        base['lastUpdated'] = datetime.utcnow().date().isoformat()

        updated_items.append(
            {
                'name': base.get('name'),
                'description_short': next_description,
            }
        )

    _content_state['last_refresh_at'] = _now()
    _content_state['last_batch_size'] = len(updated_items)
    _content_state['total_refreshed_count'] += len(updated_items)

    publish_event(
        'content.refresh.completed',
        'Content refresh completed',
        {
            'updated_count': len(updated_items),
            'total_refreshed_count': _content_state['total_refreshed_count'],
        },
    )

    return {
        'updated_count': len(updated_items),
        'updated_items': updated_items[:20],
        'state': dict(_content_state),
    }


def get_content_status() -> dict:
    return {'state': dict(_content_state)}
