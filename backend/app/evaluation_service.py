from __future__ import annotations

from datetime import datetime
from typing import Any

from .catalog_service import FALLBACK_TOOLS, list_tools
from .db import db_state, execute, query_all
from .event_service import publish_event


_evaluation_state: dict[str, Any] = {
    'last_refresh_at': None,
    'last_batch_size': 0,
    'total_refreshed_count': 0,
}


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _clamp_score(value: int) -> int:
    return max(0, min(100, int(value)))


def _score_delta(name: str, index: int) -> int:
    checksum = sum(ord(ch) for ch in (name or '')) + index
    return (checksum % 5) - 2


def refresh_evaluation_scores(payload: dict[str, Any] | None = None) -> dict:
    data = payload or {}
    requested = int(data.get('count', 25))
    batch_size = max(1, min(requested, 100))

    if db_state.enabled:
        rows = query_all(
            '''
            SELECT id, name, performance_score, value_score, popularity_score
            FROM tools
            WHERE is_active = TRUE
            ORDER BY popularity_score DESC, updated_at DESC
            LIMIT %s
            ''',
            (batch_size,),
        )

        updated_items: list[dict[str, Any]] = []
        for index, row in enumerate(rows):
            delta = _score_delta(row.get('name') or '', index)
            next_performance = _clamp_score(int(row.get('performance_score') or 0) + delta)
            next_value = _clamp_score(int(row.get('value_score') or 0) + delta)
            next_popularity = _clamp_score(int(row.get('popularity_score') or 0) + (1 if delta >= 0 else -1))

            execute(
                '''
                UPDATE tools
                SET performance_score = %s,
                    value_score = %s,
                    popularity_score = %s,
                    updated_at = NOW()
                WHERE id = %s::uuid
                ''',
                (next_performance, next_value, next_popularity, row['id']),
            )

            updated_items.append(
                {
                    'name': row.get('name'),
                    'performance_score': next_performance,
                    'value_score': next_value,
                    'popularity_score': next_popularity,
                }
            )

        _evaluation_state['last_refresh_at'] = _now()
        _evaluation_state['last_batch_size'] = len(updated_items)
        _evaluation_state['total_refreshed_count'] += len(updated_items)

        publish_event(
            'evaluation.refresh.completed',
            'Evaluation score refresh completed',
            {
                'updated_count': len(updated_items),
                'total_refreshed_count': _evaluation_state['total_refreshed_count'],
            },
        )

        return {
            'updated_count': len(updated_items),
            'updated_items': updated_items[:20],
            'state': dict(_evaluation_state),
        }

    tools = list_tools({'limit': batch_size, 'sort': 'score'}).get('items', [])
    fallback_index = {item['id']: item for item in FALLBACK_TOOLS}
    updated_items: list[dict[str, Any]] = []

    for index, item in enumerate(tools):
        base = fallback_index.get(item['id'])
        if not base:
            continue
        delta = _score_delta(base.get('name') or '', index)
        next_score = _clamp_score(int(base.get('score') or 0) + delta)
        base['score'] = next_score
        if isinstance(base.get('scoreBreakdown'), dict):
            base['scoreBreakdown']['accuracy'] = _clamp_score(int(base['scoreBreakdown'].get('accuracy') or next_score) + delta)
            base['scoreBreakdown']['value'] = _clamp_score(int(base['scoreBreakdown'].get('value') or next_score) + delta)
        base['lastUpdated'] = datetime.utcnow().date().isoformat()

        updated_items.append(
            {
                'name': base.get('name'),
                'score': base.get('score'),
            }
        )

    _evaluation_state['last_refresh_at'] = _now()
    _evaluation_state['last_batch_size'] = len(updated_items)
    _evaluation_state['total_refreshed_count'] += len(updated_items)

    publish_event(
        'evaluation.refresh.completed',
        'Evaluation score refresh completed',
        {
            'updated_count': len(updated_items),
            'total_refreshed_count': _evaluation_state['total_refreshed_count'],
        },
    )

    return {
        'updated_count': len(updated_items),
        'updated_items': updated_items[:20],
        'state': dict(_evaluation_state),
    }


def get_evaluation_status() -> dict:
    return {'state': dict(_evaluation_state)}
