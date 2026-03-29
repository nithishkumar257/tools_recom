from __future__ import annotations

from datetime import datetime

from .catalog_service import list_tools


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def get_trend_insights(limit: int = 6) -> dict:
    safe_limit = max(1, min(int(limit or 6), 20))
    items = list_tools({'limit': 300, 'sort': 'score'}).get('items', [])

    category_buckets: dict[str, dict] = {}
    for tool in items:
        category = tool.get('category') or 'General'
        bucket = category_buckets.setdefault(
            category,
            {
                'category': category,
                'tool_count': 0,
                'trending_count': 0,
                'score_total': 0,
            },
        )
        bucket['tool_count'] += 1
        bucket['score_total'] += int(tool.get('score', 0))
        if tool.get('trending'):
            bucket['trending_count'] += 1

    top_categories = []
    for bucket in category_buckets.values():
        avg_score = round(bucket['score_total'] / max(1, bucket['tool_count']), 2)
        momentum = round(avg_score + bucket['trending_count'] * 3 + min(5, bucket['tool_count'] / 2), 2)
        top_categories.append(
            {
                'category': bucket['category'],
                'tool_count': bucket['tool_count'],
                'trending_count': bucket['trending_count'],
                'average_score': avg_score,
                'momentum_index': momentum,
            }
        )

    top_categories.sort(key=lambda entry: entry['momentum_index'], reverse=True)

    top_tools = sorted(
        items,
        key=lambda tool: (
            (1 if tool.get('trending') else 0),
            int(tool.get('score', 0)),
            int(tool.get('popularity_score', 0)),
        ),
        reverse=True,
    )[:safe_limit]

    return {
        'generated_at': _now(),
        'top_categories': top_categories[:safe_limit],
        'top_tools': top_tools,
        'signals': {
            'tracked_tools': len(items),
            'tracked_categories': len(category_buckets),
            'trending_tools': len([tool for tool in items if tool.get('trending')]),
        },
    }
