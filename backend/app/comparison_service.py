from __future__ import annotations

from datetime import datetime
from typing import Any

from .catalog_service import compare_tools
from .event_service import publish_event


_comparison_state: dict[str, Any] = {
    'last_generated_at': None,
    'last_matrix_size': 0,
    'total_generated_count': 0,
}


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _normalize_slugs(payload: dict[str, Any] | None) -> list[str]:
    data = payload or {}
    source = data.get('tools')

    if isinstance(source, str):
        candidates = [part.strip().lower() for part in source.split(',')]
    elif isinstance(source, list):
        candidates = [str(item or '').strip().lower() for item in source]
    else:
        candidates = []

    slugs: list[str] = []
    for slug in candidates:
        if slug and slug not in slugs:
            slugs.append(slug)

    if len(slugs) < 2:
        raise ValueError('Provide at least two tool slugs.')
    if len(slugs) > 8:
        raise ValueError('You can compare at most eight tool slugs.')
    return slugs


def get_comparison_state() -> dict:
    return {'state': dict(_comparison_state)}


def build_comparison_matrix(payload: dict[str, Any] | None = None) -> dict:
    slugs = _normalize_slugs(payload)
    comparison = compare_tools(slugs)
    items = comparison.get('items', [])

    matrix_rows = []
    for item in items:
        matrix_rows.append(
            {
                'id': item.get('id'),
                'name': item.get('name'),
                'category': item.get('category'),
                'pricing': item.get('pricing'),
                'score': int(item.get('score', 0)),
                'performance_score': int(item.get('performance_score') or item.get('score', 0)),
                'value_score': int(item.get('value_score') or item.get('score', 0)),
                'community_rating': float(item.get('community_rating') or 0),
                'url': item.get('url'),
            }
        )

    winners = {
        'best_score': max(matrix_rows, key=lambda row: row.get('score', 0))['name'] if matrix_rows else None,
        'best_value': max(matrix_rows, key=lambda row: row.get('value_score', 0))['name'] if matrix_rows else None,
        'best_rating': max(matrix_rows, key=lambda row: row.get('community_rating', 0))['name'] if matrix_rows else None,
    }

    _comparison_state['last_generated_at'] = _now()
    _comparison_state['last_matrix_size'] = len(matrix_rows)
    _comparison_state['total_generated_count'] += 1

    publish_event(
        'comparison.matrix.generated',
        'Comparison matrix generated',
        {
            'matrix_size': len(matrix_rows),
            'winners': winners,
            'total_generated_count': _comparison_state['total_generated_count'],
        },
    )

    return {
        'matrix': matrix_rows,
        'winners': winners,
        'state': dict(_comparison_state),
    }
