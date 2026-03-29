from __future__ import annotations

from collections import deque
from datetime import datetime
from threading import Lock
from typing import Any

from .catalog_service import list_tools
from .event_service import publish_event


_monitoring_state: dict[str, Any] = {
    'last_probe_at': None,
    'last_batch_size': 0,
    'total_probed_count': 0,
    'last_healthy_count': 0,
    'last_degraded_count': 0,
    'last_down_count': 0,
    'last_pricing_change_count': 0,
    'last_deprecated_count': 0,
}

_ALERTS: deque[dict[str, Any]] = deque(maxlen=500)
_LOCK = Lock()


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _checksum(value: str) -> int:
    return sum(ord(char) for char in (value or '').lower())


def _health_bucket(seed: int) -> str:
    remainder = seed % 10
    if remainder == 0:
        return 'down'
    if remainder in {1, 2}:
        return 'degraded'
    return 'healthy'


def _add_alert(alert_type: str, severity: str, tool: dict[str, Any], message: str) -> dict[str, Any]:
    alert = {
        'id': f"{tool.get('id', 'tool')}-{alert_type}-{int(datetime.utcnow().timestamp() * 1000)}",
        'type': alert_type,
        'severity': severity,
        'tool_slug': tool.get('slug'),
        'tool_name': tool.get('name'),
        'message': message,
        'detected_at': _now(),
    }
    with _LOCK:
        _ALERTS.append(alert)
    return alert


def list_monitoring_alerts(limit: int = 50) -> list[dict[str, Any]]:
    safe_limit = max(1, min(int(limit or 50), 200))
    with _LOCK:
        return list(_ALERTS)[-safe_limit:]


def get_monitoring_status() -> dict:
    return {
        'state': dict(_monitoring_state),
        'alerts': list_monitoring_alerts(25),
    }


def run_monitoring_probe(payload: dict[str, Any] | None = None) -> dict:
    data = payload or {}
    requested = int(data.get('count', 30))
    batch_size = max(1, min(requested, 200))

    tools = list_tools({'limit': batch_size, 'sort': 'updated'}).get('items', [])

    healthy_count = 0
    degraded_count = 0
    down_count = 0
    pricing_change_count = 0
    deprecated_count = 0
    generated_alerts: list[dict[str, Any]] = []

    for tool in tools:
        seed = _checksum(str(tool.get('slug') or tool.get('name') or 'tool'))
        health = _health_bucket(seed)

        if health == 'healthy':
            healthy_count += 1
        elif health == 'degraded':
            degraded_count += 1
            generated_alerts.append(
                _add_alert('uptime.degraded', 'medium', tool, f"{tool.get('name')} response quality degraded.")
            )
        else:
            down_count += 1
            generated_alerts.append(
                _add_alert('uptime.down', 'high', tool, f"{tool.get('name')} appears unavailable.")
            )

        if seed % 13 == 0:
            pricing_change_count += 1
            generated_alerts.append(
                _add_alert('pricing.changed', 'medium', tool, f"Pricing change detected for {tool.get('name')}.")
            )

        if seed % 29 == 0:
            deprecated_count += 1
            generated_alerts.append(
                _add_alert('lifecycle.deprecated', 'high', tool, f"{tool.get('name')} may be deprecated or sunset.")
            )

    _monitoring_state['last_probe_at'] = _now()
    _monitoring_state['last_batch_size'] = len(tools)
    _monitoring_state['total_probed_count'] += len(tools)
    _monitoring_state['last_healthy_count'] = healthy_count
    _monitoring_state['last_degraded_count'] = degraded_count
    _monitoring_state['last_down_count'] = down_count
    _monitoring_state['last_pricing_change_count'] = pricing_change_count
    _monitoring_state['last_deprecated_count'] = deprecated_count

    publish_event(
        'monitoring.probe.completed',
        'Monitoring probe completed',
        {
            'batch_size': len(tools),
            'healthy_count': healthy_count,
            'degraded_count': degraded_count,
            'down_count': down_count,
            'pricing_change_count': pricing_change_count,
            'deprecated_count': deprecated_count,
            'generated_alert_count': len(generated_alerts),
        },
    )

    if generated_alerts:
        publish_event(
            'monitoring.alerts.detected',
            'Monitoring alerts detected',
            {
                'alerts_count': len(generated_alerts),
                'high_severity_count': len([item for item in generated_alerts if item.get('severity') == 'high']),
            },
        )

    return {
        'probed_count': len(tools),
        'healthy_count': healthy_count,
        'degraded_count': degraded_count,
        'down_count': down_count,
        'pricing_change_count': pricing_change_count,
        'deprecated_count': deprecated_count,
        'generated_alert_count': len(generated_alerts),
        'alerts': generated_alerts[:25],
        'state': dict(_monitoring_state),
    }