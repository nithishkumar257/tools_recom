from __future__ import annotations

from datetime import datetime
from typing import Any

from .agent_service import get_agent_runs
from .catalog_service import submit_tool
from .event_service import publish_event


_discovery_state: dict[str, Any] = {
    'scheduler_enabled': False,
    'interval_minutes': 360,
    'last_triggered_at': None,
    'last_ingest_at': None,
    'last_batch_size': 0,
    'total_ingested_count': 0,
}


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def trigger_discovery_state_mark() -> dict:
    _discovery_state['last_triggered_at'] = _now()
    publish_event(
        'discovery.triggered',
        'Discovery run triggered',
        {'last_triggered_at': _discovery_state['last_triggered_at']},
    )
    return dict(_discovery_state)


def configure_discovery_scheduler(enabled: bool, interval_minutes: int = 360) -> dict:
    _discovery_state['scheduler_enabled'] = bool(enabled)
    _discovery_state['interval_minutes'] = max(5, int(interval_minutes or 360))
    publish_event(
        'discovery.scheduler.updated',
        'Discovery scheduler updated',
        {
            'scheduler_enabled': _discovery_state['scheduler_enabled'],
            'interval_minutes': _discovery_state['interval_minutes'],
        },
    )
    return dict(_discovery_state)


def ingest_discovery_candidates(payload: dict[str, Any], user: dict[str, Any]) -> dict:
    items = payload.get('items') if isinstance(payload, dict) else None
    if not isinstance(items, list) or not items:
        raise ValueError('Body field "items" must be a non-empty array.')

    limited_items = items[:100]
    submitted: list[dict] = []
    failed: list[dict] = []

    for index, item in enumerate(limited_items):
        if not isinstance(item, dict):
            failed.append({'index': index, 'error': 'Item must be an object.'})
            continue

        candidate = {
            'name': item.get('name'),
            'website_url': item.get('website_url') or item.get('url'),
            'description': item.get('description'),
            'category': item.get('category') or 'General',
            'pricing_model': item.get('pricing_model') or 'free',
            'company': item.get('company') or None,
        }

        try:
            created = submit_tool(candidate, user)
            submitted.append(created)
        except Exception as error:
            failed.append({'index': index, 'error': str(error)})

    _discovery_state['last_ingest_at'] = _now()
    _discovery_state['last_batch_size'] = len(limited_items)
    _discovery_state['total_ingested_count'] += len(submitted)

    publish_event(
        'discovery.ingest.completed',
        'Discovery ingestion completed',
        {
            'submitted_count': len(submitted),
            'failed_count': len(failed),
            'last_batch_size': _discovery_state['last_batch_size'],
            'total_ingested_count': _discovery_state['total_ingested_count'],
        },
    )

    return {
        'submitted_count': len(submitted),
        'failed_count': len(failed),
        'submitted_items': submitted[:20],
        'failed_items': failed[:20],
        'state': dict(_discovery_state),
    }


def get_discovery_status() -> dict:
    runs = [run for run in get_agent_runs(30) if run.get('agent_name') == 'discovery_agent']
    latest_run = runs[0] if runs else None
    return {
        'state': dict(_discovery_state),
        'latest_run': latest_run,
        'recent_runs': runs[:10],
    }
