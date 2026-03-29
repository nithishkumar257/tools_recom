from __future__ import annotations

import hashlib
import json
import queue
from collections import deque
import csv
import io
from datetime import datetime, timedelta
from threading import Event, Lock, Thread
from typing import Any
from uuid import uuid4

from .config import settings
from .db import db_state, execute, query_all
from .event_service import publish_event

try:
    from pywebpush import WebPushException, webpush
except Exception:  # pragma: no cover
    WebPushException = Exception
    webpush = None


_SUBSCRIPTIONS_BY_USER: dict[str, list[dict[str, Any]]] = {}
_LOCK = Lock()

_JOB_QUEUE: queue.Queue[dict[str, Any]] = queue.Queue(maxsize=200)
_WORKER_THREAD: Thread | None = None
_WORKER_STOP = Event()

_CAMPAIGN_STATE: dict[str, Any] = {
    'scheduler_enabled': False,
    'interval_minutes': 30,
    'low_success_streak': 0,
    'auto_paused_by_policy': False,
    'auto_paused_at': None,
    'policy_pause_reason': None,
    'resume_recommendation_emitted': False,
    'resume_recommendation_streak': 0,
    'auto_resumed_at': None,
    'auto_resume_lock_enabled': bool(settings.web_push_auto_resume_locked),
    'auto_resume_lock_updated_at': None,
    'last_enqueued_at': None,
    'last_started_at': None,
    'last_completed_at': None,
    'last_campaign_id': None,
    'last_status': 'idle',
}

_DELIVERY_METRICS: dict[str, Any] = {
    'total_enqueued': 0,
    'total_delivered': 0,
    'total_queued': 0,
    'total_failed': 0,
    'total_stale_pruned': 0,
    'last_delivery_mode': 'simulation',
    'last_error': None,
    'updated_at': None,
}

_CAMPAIGN_HISTORY: deque[dict[str, Any]] = deque(maxlen=300)
_POLICY_AUDIT_HISTORY: deque[dict[str, Any]] = deque(maxlen=500)
_POLICY_AUDIT_TABLE_READY = False


def _upsert_campaign_history(campaign_id: str, values: dict[str, Any]) -> None:
    with _LOCK:
        updated = False
        items = list(_CAMPAIGN_HISTORY)
        for index, item in enumerate(items):
            if str(item.get('campaign_id')) == campaign_id:
                merged = {**item, **values}
                items[index] = merged
                updated = True
                break

        if not updated:
            items.append({'campaign_id': campaign_id, **values})

        _CAMPAIGN_HISTORY.clear()
        _CAMPAIGN_HISTORY.extend(items[-_CAMPAIGN_HISTORY.maxlen:])


def _get_campaign_history_item(campaign_id: str) -> dict[str, Any] | None:
    with _LOCK:
        for item in reversed(_CAMPAIGN_HISTORY):
            if str(item.get('campaign_id')) == campaign_id:
                return dict(item)
    return None


def _utc_now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _ensure_policy_audit_table() -> None:
    global _POLICY_AUDIT_TABLE_READY
    if _POLICY_AUDIT_TABLE_READY or not db_state.enabled:
        return

    execute(
        '''
        CREATE TABLE IF NOT EXISTS push_policy_audit (
            id UUID PRIMARY KEY,
            action TEXT NOT NULL,
            actor_user_id TEXT,
            source TEXT NOT NULL,
            reason TEXT,
            details JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        '''
    )
    execute('CREATE INDEX IF NOT EXISTS idx_push_policy_audit_created_at ON push_policy_audit (created_at DESC)')
    execute('CREATE INDEX IF NOT EXISTS idx_push_policy_audit_action ON push_policy_audit (action)')
    execute('CREATE INDEX IF NOT EXISTS idx_push_policy_audit_source ON push_policy_audit (source)')
    execute('CREATE INDEX IF NOT EXISTS idx_push_policy_audit_actor_user_id ON push_policy_audit (actor_user_id)')

    _POLICY_AUDIT_TABLE_READY = True


def _append_policy_audit(
    action: str,
    *,
    actor_user_id: str | None = None,
    source: str = 'system',
    reason: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    entry = {
        'id': str(uuid4()),
        'action': str(action or '').strip() or 'unknown',
        'actor_user_id': str(actor_user_id or '').strip() or None,
        'source': str(source or 'system').strip() or 'system',
        'reason': str(reason or '').strip() or None,
        'details': details or {},
        'created_at': _utc_now(),
    }
    with _LOCK:
        _POLICY_AUDIT_HISTORY.append(entry)

    if db_state.enabled:
        try:
            _ensure_policy_audit_table()
            execute(
                '''
                INSERT INTO push_policy_audit (id, action, actor_user_id, source, reason, details, created_at)
                VALUES (%s::uuid, %s, %s, %s, %s, %s::jsonb, %s)
                ''',
                (
                    entry['id'],
                    entry['action'],
                    entry['actor_user_id'],
                    entry['source'],
                    entry['reason'],
                    json.dumps(entry['details']),
                    entry['created_at'],
                ),
            )
        except Exception:
            pass


def _parse_iso_datetime(value: Any) -> datetime | None:
    text = str(value or '').strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace('Z', ''))
    except Exception:
        return None


def _calculate_resume_recommendation() -> dict[str, Any]:
    with _LOCK:
        auto_paused = bool(_CAMPAIGN_STATE.get('auto_paused_by_policy'))
        auto_paused_at = _CAMPAIGN_STATE.get('auto_paused_at')

    if not auto_paused:
        return {
            'recommended': False,
            'reason': 'Scheduler is not auto-paused.',
            'average_success_rate': None,
            'sample_size': 0,
        }

    cooldown_minutes = max(1, int(settings.web_push_resume_cooldown_minutes or 30))
    healthy_threshold = max(0.0, min(float(settings.web_push_resume_healthy_threshold or 70.0), 100.0))
    min_campaigns = max(1, int(settings.web_push_resume_min_campaigns or 3))

    paused_time = _parse_iso_datetime(auto_paused_at)
    now = datetime.utcnow()
    if paused_time:
        cooldown_ready_at = paused_time + timedelta(minutes=cooldown_minutes)
        if now < cooldown_ready_at:
            remaining = int((cooldown_ready_at - now).total_seconds() // 60) + 1
            return {
                'recommended': False,
                'reason': f'Cooldown active. Wait about {remaining} more minute(s) before resume.',
                'average_success_rate': None,
                'sample_size': 0,
            }

    history_items = list_push_campaign_history(40).get('items', [])
    completed = [
        item for item in history_items
        if str(item.get('status') or '').lower() == 'completed'
    ]
    if len(completed) < min_campaigns:
        return {
            'recommended': False,
            'reason': f'Need at least {min_campaigns} completed campaign sample(s) for health-check.',
            'average_success_rate': None,
            'sample_size': len(completed),
        }

    sample = completed[:min_campaigns]
    rates = [float(item.get('delivery_rate') or 0.0) for item in sample]
    average_rate = round(sum(rates) / max(1, len(rates)), 2)
    recommended = average_rate >= healthy_threshold

    return {
        'recommended': recommended,
        'reason': (
            f'Resume recommended: average success {average_rate}% >= {healthy_threshold}%.'
            if recommended
            else f'Resume not recommended: average success {average_rate}% < {healthy_threshold}%.'
        ),
        'average_success_rate': average_rate,
        'sample_size': len(sample),
    }


def _apply_controlled_auto_resume(campaign_id: str, recommendation: dict[str, Any]) -> dict[str, Any]:
    auto_resume_enabled = bool(settings.web_push_auto_resume_enabled)
    required_checks = max(1, int(settings.web_push_auto_resume_checks or 2))

    with _LOCK:
        auto_paused = bool(_CAMPAIGN_STATE.get('auto_paused_by_policy'))
        lock_enabled = bool(_CAMPAIGN_STATE.get('auto_resume_lock_enabled'))
        if not auto_paused:
            _CAMPAIGN_STATE['resume_recommendation_streak'] = 0
            return {
                'auto_resumed': False,
                'streak': 0,
                'required_checks': required_checks,
                'enabled': auto_resume_enabled,
                'locked': lock_enabled,
            }

        recommended = bool(recommendation.get('recommended'))
        if recommended:
            _CAMPAIGN_STATE['resume_recommendation_streak'] = int(_CAMPAIGN_STATE.get('resume_recommendation_streak') or 0) + 1
        else:
            _CAMPAIGN_STATE['resume_recommendation_streak'] = 0

        streak = int(_CAMPAIGN_STATE.get('resume_recommendation_streak') or 0)
        should_auto_resume = auto_resume_enabled and (not lock_enabled) and recommended and streak >= required_checks

        if should_auto_resume:
            _CAMPAIGN_STATE['scheduler_enabled'] = True
            _CAMPAIGN_STATE['auto_paused_by_policy'] = False
            _CAMPAIGN_STATE['auto_paused_at'] = None
            _CAMPAIGN_STATE['policy_pause_reason'] = None
            _CAMPAIGN_STATE['low_success_streak'] = 0
            _CAMPAIGN_STATE['resume_recommendation_streak'] = 0
            _CAMPAIGN_STATE['resume_recommendation_emitted'] = False
            _CAMPAIGN_STATE['auto_resumed_at'] = _utc_now()

    if should_auto_resume:
        _append_policy_audit(
            'scheduler.auto_resumed',
            source='policy',
            reason='Auto-resume criteria satisfied after healthy recommendation streak.',
            details={
                'campaign_id': campaign_id,
                'required_checks': required_checks,
                'average_success_rate': recommendation.get('average_success_rate'),
                'sample_size': recommendation.get('sample_size'),
            },
        )
        publish_event(
            'push.scheduler.auto_resumed',
            'Push scheduler auto-resumed after consecutive healthy recommendations.',
            {
                'campaign_id': campaign_id,
                'required_checks': required_checks,
                'average_success_rate': recommendation.get('average_success_rate'),
                'sample_size': recommendation.get('sample_size'),
            },
        )

    return {
        'auto_resumed': should_auto_resume,
        'streak': streak,
        'required_checks': required_checks,
        'enabled': auto_resume_enabled,
        'locked': lock_enabled,
    }


def set_auto_resume_lock(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = payload or {}
    locked = bool(data.get('locked', True))
    confirm_unlock = bool(data.get('confirm_unlock', False))
    actor_user_id = str(data.get('actor_user_id') or '').strip() or None
    source = str(data.get('source') or 'admin_api').strip() or 'admin_api'
    reason = str(data.get('reason') or '').strip() or None

    if not locked and not confirm_unlock:
        raise ValueError('Unlock requires confirm_unlock=true.')

    with _LOCK:
        previous_locked = bool(_CAMPAIGN_STATE.get('auto_resume_lock_enabled'))
        _CAMPAIGN_STATE['auto_resume_lock_enabled'] = locked
        _CAMPAIGN_STATE['auto_resume_lock_updated_at'] = _utc_now()
        if locked:
            _CAMPAIGN_STATE['resume_recommendation_streak'] = 0

    _append_policy_audit(
        'auto_resume_lock.updated',
        actor_user_id=actor_user_id,
        source=source,
        reason=reason,
        details={
            'previous_locked': previous_locked,
            'locked': locked,
            'confirm_unlock': confirm_unlock,
        },
    )

    publish_event(
        'push.policy.auto_resume_lock.updated',
        'Push auto-resume governance lock updated',
        {
            'locked': locked,
        },
    )

    return get_push_campaign_status()


def _web_push_configured() -> bool:
    return bool(settings.web_push_private_key and settings.web_push_subject)


def _web_push_ready() -> bool:
    return webpush is not None and _web_push_configured()


def _safe_user_id(user: dict[str, Any]) -> str:
    user_id = str(user.get('id') or '').strip()
    if not user_id:
        raise ValueError('User identifier is missing.')
    return user_id


def _normalize_subscription_payload(payload: dict[str, Any] | None) -> dict[str, Any]:
    data = payload or {}
    endpoint = str(data.get('endpoint') or '').strip()
    if not endpoint:
        raise ValueError('Subscription endpoint is required.')

    keys = data.get('keys') if isinstance(data.get('keys'), dict) else {}
    auth_key = str(keys.get('auth') or '').strip()
    p256dh_key = str(keys.get('p256dh') or '').strip()
    if not auth_key or not p256dh_key:
        raise ValueError('Subscription keys.auth and keys.p256dh are required.')

    expiration = data.get('expirationTime')
    if expiration is not None:
        expiration = str(expiration)

    return {
        'endpoint': endpoint,
        'keys': {
            'auth': auth_key,
            'p256dh': p256dh_key,
        },
        'expirationTime': expiration,
        'updated_at': _utc_now(),
    }


def _normalize_campaign_payload(payload: dict[str, Any] | None) -> dict[str, Any]:
    data = payload or {}
    title = str(data.get('title') or 'AI Brutal notification').strip() or 'AI Brutal notification'
    body = str(data.get('body') or 'You have a new platform update.').strip() or 'You have a new platform update.'
    target_user_id = str(data.get('target_user_id') or '').strip() or None
    limit = int(data.get('limit') or 200)
    safe_limit = max(1, min(limit, 1000))

    return {
        'title': title,
        'body': body,
        'target_user_id': target_user_id,
        'limit': safe_limit,
    }


def _serialize_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        'endpoint': str(row.get('endpoint') or ''),
        'keys': {
            'auth': str((row.get('keys') or {}).get('auth') or ''),
            'p256dh': str((row.get('keys') or {}).get('p256dh') or ''),
        },
        'expirationTime': row.get('expiration_time'),
        'updated_at': row.get('updated_at') or _utc_now(),
    }


def _delete_subscription_by_endpoint(user_id: str, endpoint: str) -> int:
    removed = 0
    if db_state.enabled:
        try:
            before = query_all('SELECT endpoint FROM push_subscriptions WHERE user_id = %s', (user_id,))
            execute('DELETE FROM push_subscriptions WHERE user_id = %s AND endpoint = %s', (user_id, endpoint))
            after = query_all('SELECT endpoint FROM push_subscriptions WHERE user_id = %s', (user_id,))
            removed = max(0, len(before) - len(after))
        except Exception:
            removed = 0

    if removed == 0:
        with _LOCK:
            items = _SUBSCRIPTIONS_BY_USER.get(user_id, [])
            filtered = [item for item in items if item.get('endpoint') != endpoint]
            removed = len(items) - len(filtered)
            _SUBSCRIPTIONS_BY_USER[user_id] = filtered

    return removed


def _build_subscription_info(item: dict[str, Any]) -> dict[str, Any]:
    keys = item.get('keys') if isinstance(item.get('keys'), dict) else {}
    return {
        'endpoint': str(item.get('endpoint') or ''),
        'keys': {
            'auth': str(keys.get('auth') or ''),
            'p256dh': str(keys.get('p256dh') or ''),
        },
    }


def _send_push_with_retries(item: dict[str, Any], payload: dict[str, Any], max_retries: int) -> dict[str, Any]:
    if not _web_push_ready():
        return {
            'status': 'queued',
            'attempts': 0,
            'reason': 'web_push_not_configured',
        }

    subscription_info = _build_subscription_info(item)
    max_attempts = max(1, int(max_retries or 1))

    for attempt in range(1, max_attempts + 1):
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.web_push_private_key,
                vapid_claims={'sub': settings.web_push_subject},
            )
            return {
                'status': 'delivered',
                'attempts': attempt,
            }
        except WebPushException as error:  # type: ignore[misc]
            response = getattr(error, 'response', None)
            status_code = int(getattr(response, 'status_code', 0) or 0)
            reason = str(error)

            if status_code in {404, 410}:
                return {
                    'status': 'stale',
                    'attempts': attempt,
                    'http_status': status_code,
                    'reason': reason,
                }

            retryable = status_code in {429, 500, 502, 503, 504} or status_code == 0
            if retryable and attempt < max_attempts:
                continue

            return {
                'status': 'failed',
                'attempts': attempt,
                'http_status': status_code or None,
                'reason': reason,
            }
        except Exception as error:  # pragma: no cover
            if attempt < max_attempts:
                continue
            return {
                'status': 'failed',
                'attempts': attempt,
                'reason': str(error),
            }

    return {
        'status': 'failed',
        'attempts': max_attempts,
        'reason': 'unknown_delivery_error',
    }


def _list_all_subscriptions(limit: int = 1000) -> list[dict[str, Any]]:
    safe_limit = max(1, min(int(limit or 1000), 5000))

    if db_state.enabled:
        try:
            rows = query_all(
                '''
                SELECT user_id::text AS user_id, endpoint, keys, expiration_time, updated_at
                FROM push_subscriptions
                ORDER BY updated_at DESC
                LIMIT %s
                ''',
                (safe_limit,),
            )
            return [
                {
                    'user_id': str(row.get('user_id') or ''),
                    **_serialize_record(row),
                }
                for row in rows
            ]
        except Exception:
            pass

    items: list[dict[str, Any]] = []
    with _LOCK:
        for user_id, subscriptions in _SUBSCRIPTIONS_BY_USER.items():
            for item in subscriptions:
                items.append({'user_id': user_id, **dict(item)})
                if len(items) >= safe_limit:
                    return items

    return items


def _list_user_subscriptions(user_id: str, limit: int = 1000) -> list[dict[str, Any]]:
    safe_limit = max(1, min(int(limit or 1000), 5000))

    if db_state.enabled:
        try:
            rows = query_all(
                '''
                SELECT endpoint, keys, expiration_time, updated_at
                FROM push_subscriptions
                WHERE user_id = %s
                ORDER BY updated_at DESC
                LIMIT %s
                ''',
                (user_id, safe_limit),
            )
            return [_serialize_record(row) for row in rows]
        except Exception:
            pass

    with _LOCK:
        items = [dict(item) for item in _SUBSCRIPTIONS_BY_USER.get(user_id, [])]
    return items[:safe_limit]


def _set_metric_values(**kwargs: Any) -> None:
    with _LOCK:
        _DELIVERY_METRICS.update(kwargs)
        _DELIVERY_METRICS['updated_at'] = _utc_now()


def _process_campaign_job(job: dict[str, Any]) -> None:
    campaign_id = str(job.get('campaign_id') or uuid4())
    payload = _normalize_campaign_payload(job.get('payload'))
    target_user_id = payload.get('target_user_id')
    queued_at = str(job.get('queued_at') or _utc_now())

    with _LOCK:
        _CAMPAIGN_STATE['last_started_at'] = _utc_now()
        _CAMPAIGN_STATE['last_campaign_id'] = campaign_id
        _CAMPAIGN_STATE['last_status'] = 'running'

    max_retries = max(1, int(settings.web_push_max_retries or 2))
    delivery_mode = 'webpush' if _web_push_ready() else 'simulation'

    targets: list[dict[str, Any]] = []
    if target_user_id:
        subscriptions = _list_user_subscriptions(str(target_user_id), payload['limit'])
        targets = [{'user_id': str(target_user_id), **item} for item in subscriptions]
    else:
        targets = _list_all_subscriptions(payload['limit'])

    delivered_count = 0
    queued_count = 0
    failed_count = 0
    stale_removed_count = 0

    notification_payload = {
        'title': payload['title'],
        'body': payload['body'],
        'tag': f'aibrutal-campaign-{campaign_id[:8]}',
        'data': {
            'url': '/dashboard',
            'source': 'campaign',
            'campaign_id': campaign_id,
        },
    }

    for item in targets:
        user_id = str(item.get('user_id') or '')
        endpoint = str(item.get('endpoint') or '')
        endpoint_hash = hashlib.sha256(endpoint.encode('utf-8')).hexdigest()[:12]

        result = _send_push_with_retries(item, notification_payload, max_retries)
        status = str(result.get('status') or 'failed')

        if status == 'delivered':
            delivered_count += 1
        elif status == 'queued':
            queued_count += 1
        elif status == 'stale':
            removed = _delete_subscription_by_endpoint(user_id, endpoint)
            stale_removed_count += max(0, removed)
            failed_count += 1
            publish_event(
                'push.subscription.pruned',
                'Stale push subscription pruned during campaign',
                {
                    'user_id': user_id,
                    'endpoint_hash': endpoint_hash,
                    'campaign_id': campaign_id,
                },
            )
        else:
            failed_count += 1

    delivery_rate = 0.0
    if len(targets) > 0:
        delivery_rate = round((delivered_count / len(targets)) * 100, 2)

    low_success_threshold = max(0.0, min(float(settings.web_push_alert_success_threshold or 60.0), 100.0))
    low_success_alert = len(targets) > 0 and delivery_rate < low_success_threshold
    auto_pause_streak_threshold = max(1, int(settings.web_push_auto_pause_streak or 3))

    _set_metric_values(
        total_delivered=int(_DELIVERY_METRICS.get('total_delivered', 0)) + delivered_count,
        total_queued=int(_DELIVERY_METRICS.get('total_queued', 0)) + queued_count,
        total_failed=int(_DELIVERY_METRICS.get('total_failed', 0)) + failed_count,
        total_stale_pruned=int(_DELIVERY_METRICS.get('total_stale_pruned', 0)) + stale_removed_count,
        last_delivery_mode=delivery_mode,
        last_error=None,
    )

    with _LOCK:
        _CAMPAIGN_STATE['last_completed_at'] = _utc_now()
        _CAMPAIGN_STATE['last_campaign_id'] = campaign_id
        _CAMPAIGN_STATE['last_status'] = 'completed'
        if low_success_alert:
            _CAMPAIGN_STATE['low_success_streak'] = int(_CAMPAIGN_STATE.get('low_success_streak') or 0) + 1
        else:
            _CAMPAIGN_STATE['low_success_streak'] = 0

        streak = int(_CAMPAIGN_STATE.get('low_success_streak') or 0)
        should_auto_pause = (
            bool(_CAMPAIGN_STATE.get('scheduler_enabled'))
            and streak >= auto_pause_streak_threshold
        )
        if should_auto_pause:
            _CAMPAIGN_STATE['scheduler_enabled'] = False
            _CAMPAIGN_STATE['auto_paused_by_policy'] = True
            _CAMPAIGN_STATE['auto_paused_at'] = _utc_now()
            _CAMPAIGN_STATE['policy_pause_reason'] = (
                f'Auto-paused after {streak} consecutive low-success campaigns '
                f'(threshold < {low_success_threshold}%).'
            )
            _CAMPAIGN_STATE['resume_recommendation_emitted'] = False
            _CAMPAIGN_STATE['resume_recommendation_streak'] = 0

    _upsert_campaign_history(
        campaign_id,
        {
            'status': 'completed',
            'queued_at': queued_at,
            'started_at': _CAMPAIGN_STATE.get('last_started_at'),
            'completed_at': _CAMPAIGN_STATE.get('last_completed_at'),
            'title': payload['title'],
            'target_user_id': target_user_id,
            'delivery_mode': delivery_mode,
            'target_count': len(targets),
            'delivered_count': delivered_count,
            'queued_count': queued_count,
            'failed_count': failed_count,
            'stale_removed_count': stale_removed_count,
            'delivery_rate': delivery_rate,
            'alert_low_success': low_success_alert,
        },
    )

    if should_auto_pause:
        _append_policy_audit(
            'scheduler.auto_paused',
            source='policy',
            reason='Consecutive low-success campaigns reached auto-pause threshold.',
            details={
                'campaign_id': campaign_id,
                'low_success_streak': low_success_streak,
                'threshold': low_success_threshold,
                'delivery_rate': delivery_rate,
            },
        )

    publish_event(
        'push.campaign.completed',
        'Push campaign completed',
        {
            'campaign_id': campaign_id,
            'delivery_mode': delivery_mode,
            'target_count': len(targets),
            'delivered_count': delivered_count,
            'queued_count': queued_count,
            'failed_count': failed_count,
            'stale_removed_count': stale_removed_count,
        },
    )

    if low_success_alert:
        severity = 'critical' if delivery_rate < 20 else 'warning'
        publish_event(
            'push.alert.low_success_rate',
            f'Push campaign success rate is below threshold ({delivery_rate}%)',
            {
                'severity': severity,
                'campaign_id': campaign_id,
                'delivery_rate': delivery_rate,
                'threshold': low_success_threshold,
                'target_count': len(targets),
                'delivered_count': delivered_count,
                'failed_count': failed_count,
            },
        )

    with _LOCK:
        policy_auto_paused = bool(_CAMPAIGN_STATE.get('auto_paused_by_policy'))
        policy_pause_reason = _CAMPAIGN_STATE.get('policy_pause_reason')
        low_success_streak = int(_CAMPAIGN_STATE.get('low_success_streak') or 0)

    if policy_auto_paused:
        publish_event(
            'push.scheduler.auto_paused',
            'Push scheduler auto-paused by reliability policy',
            {
                'campaign_id': campaign_id,
                'low_success_streak': low_success_streak,
                'reason': policy_pause_reason,
            },
        )

    recommendation = _calculate_resume_recommendation()
    if policy_auto_paused and recommendation.get('recommended'):
        should_emit_resume_recommendation = False
        with _LOCK:
            if not bool(_CAMPAIGN_STATE.get('resume_recommendation_emitted')):
                _CAMPAIGN_STATE['resume_recommendation_emitted'] = True
                should_emit_resume_recommendation = True

        if should_emit_resume_recommendation:
            publish_event(
                'push.scheduler.resume_recommended',
                'Push scheduler resume is recommended after cooldown health-check.',
                {
                    'campaign_id': campaign_id,
                    'average_success_rate': recommendation.get('average_success_rate'),
                    'sample_size': recommendation.get('sample_size'),
                },
            )

    _apply_controlled_auto_resume(campaign_id, recommendation)


def _worker_loop() -> None:
    while not _WORKER_STOP.is_set():
        try:
            job = _JOB_QUEUE.get(timeout=0.5)
        except queue.Empty:
            continue

        try:
            _process_campaign_job(job)
        except Exception as error:  # pragma: no cover
            _set_metric_values(last_error=str(error))
            with _LOCK:
                _CAMPAIGN_STATE['last_status'] = 'failed'
            campaign_id = str(job.get('campaign_id') or '')
            if campaign_id:
                _upsert_campaign_history(
                    campaign_id,
                    {
                        'status': 'failed',
                        'queued_at': str(job.get('queued_at') or _utc_now()),
                        'completed_at': _utc_now(),
                        'error': str(error),
                    },
                )
            publish_event('push.campaign.failed', 'Push campaign failed', {'error': str(error)})
        finally:
            _JOB_QUEUE.task_done()


def initialize_push_delivery_worker() -> None:
    global _WORKER_THREAD
    if _WORKER_THREAD and _WORKER_THREAD.is_alive():
        return

    _WORKER_STOP.clear()
    _WORKER_THREAD = Thread(target=_worker_loop, name='push-delivery-worker', daemon=True)
    _WORKER_THREAD.start()


def shutdown_push_delivery_worker() -> None:
    _WORKER_STOP.set()
    worker = _WORKER_THREAD
    if worker and worker.is_alive():
        worker.join(timeout=1.5)


def list_push_subscriptions(user: dict[str, Any]) -> dict[str, Any]:
    user_id = _safe_user_id(user)
    items = _list_user_subscriptions(user_id, 1000)
    return {'items': items, 'count': len(items)}


def upsert_push_subscription(user: dict[str, Any], payload: dict[str, Any] | None) -> dict[str, Any]:
    user_id = _safe_user_id(user)
    normalized = _normalize_subscription_payload(payload)

    if db_state.enabled:
        try:
            execute(
                '''
                INSERT INTO push_subscriptions (user_id, endpoint, keys, expiration_time, updated_at)
                VALUES (%s, %s, %s::jsonb, %s, NOW())
                ON CONFLICT (user_id, endpoint)
                DO UPDATE SET keys = EXCLUDED.keys, expiration_time = EXCLUDED.expiration_time, updated_at = NOW()
                ''',
                (
                    user_id,
                    normalized['endpoint'],
                    json.dumps(normalized['keys']),
                    normalized['expirationTime'],
                ),
            )
        except Exception:
            with _LOCK:
                items = _SUBSCRIPTIONS_BY_USER.setdefault(user_id, [])
                items = [item for item in items if item.get('endpoint') != normalized['endpoint']]
                items.append(normalized)
                _SUBSCRIPTIONS_BY_USER[user_id] = items[-20:]
    else:
        with _LOCK:
            items = _SUBSCRIPTIONS_BY_USER.setdefault(user_id, [])
            items = [item for item in items if item.get('endpoint') != normalized['endpoint']]
            items.append(normalized)
            _SUBSCRIPTIONS_BY_USER[user_id] = items[-20:]

    publish_event(
        'push.subscription.upserted',
        'Push subscription registered/updated',
        {
            'user_id': user_id,
            'endpoint_hash': hashlib.sha256(normalized['endpoint'].encode('utf-8')).hexdigest()[:12],
        },
    )

    return {
        'item': normalized,
        'message': 'Push subscription saved.',
    }


def remove_push_subscription(user: dict[str, Any], endpoint: str) -> dict[str, Any]:
    user_id = _safe_user_id(user)
    normalized_endpoint = str(endpoint or '').strip()
    if not normalized_endpoint:
        raise ValueError('Subscription endpoint is required.')

    removed = _delete_subscription_by_endpoint(user_id, normalized_endpoint)

    publish_event(
        'push.subscription.removed',
        'Push subscription removed',
        {
            'user_id': user_id,
            'removed_count': removed,
        },
    )

    return {
        'removed_count': removed,
        'message': 'Push subscription removed.' if removed else 'No matching push subscription found.',
    }


def trigger_test_push(user: dict[str, Any], payload: dict[str, Any] | None = None) -> dict[str, Any]:
    user_id = _safe_user_id(user)
    campaign_payload = _normalize_campaign_payload({
        **(payload or {}),
        'target_user_id': user_id,
        'limit': 200,
    })

    campaign_result = queue_push_campaign(campaign_payload)

    return {
        'notification': {
            'title': campaign_payload['title'],
            'body': campaign_payload['body'],
            'created_at': _utc_now(),
        },
        'subscription_count': list_push_subscriptions(user).get('count', 0),
        'delivered_count': 0,
        'queued_count': 0,
        'failed_count': 0,
        'stale_removed_count': 0,
        'deliveries': [],
        'delivery_mode': 'webpush' if _web_push_ready() else 'simulation',
        'campaign_id': campaign_result.get('campaign_id'),
        'message': 'Push test campaign queued for background delivery.',
    }


def queue_push_campaign(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    normalized = _normalize_campaign_payload(payload)
    campaign_id = str(uuid4())
    job = {
        'campaign_id': campaign_id,
        'payload': normalized,
        'queued_at': _utc_now(),
    }

    try:
        _JOB_QUEUE.put_nowait(job)
    except queue.Full as error:
        raise ValueError('Push campaign queue is full. Please retry in a moment.') from error

    with _LOCK:
        _CAMPAIGN_STATE['last_enqueued_at'] = _utc_now()
        _CAMPAIGN_STATE['last_campaign_id'] = campaign_id
        _CAMPAIGN_STATE['last_status'] = 'queued'

    _set_metric_values(total_enqueued=int(_DELIVERY_METRICS.get('total_enqueued', 0)) + 1)

    _upsert_campaign_history(
        campaign_id,
        {
            'status': 'queued',
            'queued_at': job['queued_at'],
            'title': normalized.get('title'),
            'target_user_id': normalized.get('target_user_id'),
            'target_count': 0,
            'delivered_count': 0,
            'queued_count': 0,
            'failed_count': 0,
            'stale_removed_count': 0,
            'delivery_mode': 'webpush' if _web_push_ready() else 'simulation',
            'delivery_rate': 0,
        },
    )

    publish_event(
        'push.campaign.queued',
        'Push campaign queued',
        {
            'campaign_id': campaign_id,
            'target_user_id': normalized.get('target_user_id'),
            'limit': normalized.get('limit'),
            'queue_size': _JOB_QUEUE.qsize(),
        },
    )

    return {
        'campaign_id': campaign_id,
        'queue_size': _JOB_QUEUE.qsize(),
        'status': 'queued',
        'message': 'Push campaign queued for background dispatch.',
    }


def configure_push_scheduler(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = payload or {}
    enabled = bool(data.get('enabled', False))
    interval_minutes = max(1, min(int(data.get('interval_minutes') or 30), 24 * 60))
    actor_user_id = str(data.get('actor_user_id') or '').strip() or None
    source = str(data.get('source') or 'admin_api').strip() or 'admin_api'
    reason = str(data.get('reason') or '').strip() or None

    with _LOCK:
        previous_enabled = bool(_CAMPAIGN_STATE.get('scheduler_enabled'))
        previous_interval = int(_CAMPAIGN_STATE.get('interval_minutes') or 30)
        _CAMPAIGN_STATE['scheduler_enabled'] = enabled
        _CAMPAIGN_STATE['interval_minutes'] = interval_minutes
        _CAMPAIGN_STATE['auto_resumed_at'] = None
        if enabled:
            _CAMPAIGN_STATE['auto_paused_by_policy'] = False
            _CAMPAIGN_STATE['auto_paused_at'] = None
            _CAMPAIGN_STATE['policy_pause_reason'] = None
            _CAMPAIGN_STATE['low_success_streak'] = 0
            _CAMPAIGN_STATE['resume_recommendation_emitted'] = False
            _CAMPAIGN_STATE['resume_recommendation_streak'] = 0

    _append_policy_audit(
        'scheduler.updated',
        actor_user_id=actor_user_id,
        source=source,
        reason=reason,
        details={
            'previous_enabled': previous_enabled,
            'enabled': enabled,
            'previous_interval_minutes': previous_interval,
            'interval_minutes': interval_minutes,
        },
    )

    publish_event(
        'push.scheduler.updated',
        'Push campaign scheduler updated',
        {
            'enabled': enabled,
            'interval_minutes': interval_minutes,
        },
    )

    return get_push_campaign_status()


def run_push_scheduler_tick(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = payload or {}
    force = bool(data.get('force', False))
    title = str(data.get('title') or 'AI Brutal digest').strip() or 'AI Brutal digest'
    body = str(data.get('body') or 'New recommendations are available in your dashboard.').strip() or 'New recommendations are available in your dashboard.'

    with _LOCK:
        enabled = bool(_CAMPAIGN_STATE.get('scheduler_enabled', False))
        interval_minutes = int(_CAMPAIGN_STATE.get('interval_minutes') or 30)
        last_started_at = _CAMPAIGN_STATE.get('last_started_at')
        auto_paused_by_policy = bool(_CAMPAIGN_STATE.get('auto_paused_by_policy'))
        policy_pause_reason = str(_CAMPAIGN_STATE.get('policy_pause_reason') or '').strip()

    if auto_paused_by_policy:
        recommendation = _calculate_resume_recommendation()
        return {
            'queued': False,
            'message': recommendation.get('reason') or policy_pause_reason or 'Scheduler is auto-paused by policy. Re-enable scheduler manually to resume.',
            'state': get_push_campaign_status(),
        }

    should_queue = force or enabled
    if should_queue and not force and last_started_at:
        try:
            last_time = datetime.fromisoformat(str(last_started_at).replace('Z', ''))
            next_time = last_time + timedelta(minutes=interval_minutes)
            should_queue = datetime.utcnow() >= next_time
        except Exception:
            should_queue = True

    if not should_queue:
        return {
            'queued': False,
            'message': 'Scheduler tick skipped (interval not reached or scheduler disabled).',
            'state': get_push_campaign_status(),
        }

    result = queue_push_campaign({'title': title, 'body': body, 'limit': int(data.get('limit') or 500)})
    return {
        'queued': True,
        'campaign': result,
        'state': get_push_campaign_status(),
    }


def get_push_campaign_status() -> dict[str, Any]:
    with _LOCK:
        state = dict(_CAMPAIGN_STATE)

    recommendation = _calculate_resume_recommendation()

    return {
        'state': {
            **state,
            'queue_size': _JOB_QUEUE.qsize(),
            'worker_running': bool(_WORKER_THREAD and _WORKER_THREAD.is_alive()),
            'auto_resume_enabled': bool(settings.web_push_auto_resume_enabled),
            'auto_resume_required_checks': max(1, int(settings.web_push_auto_resume_checks or 2)),
            'auto_resume_lock_enabled': bool(state.get('auto_resume_lock_enabled')),
            'auto_resume_lock_updated_at': state.get('auto_resume_lock_updated_at'),
            'resume_recommended': bool(recommendation.get('recommended')),
            'resume_recommendation_reason': recommendation.get('reason'),
            'resume_average_success_rate': recommendation.get('average_success_rate'),
            'resume_sample_size': recommendation.get('sample_size'),
            'policy_history_count': len(_POLICY_AUDIT_HISTORY),
        }
    }


def get_push_delivery_metrics() -> dict[str, Any]:
    with _LOCK:
        metrics = dict(_DELIVERY_METRICS)

    metrics['queue_size'] = _JOB_QUEUE.qsize()
    metrics['delivery_ready'] = _web_push_ready()
    metrics['delivery_mode'] = 'webpush' if _web_push_ready() else 'simulation'
    return {'metrics': metrics}


def list_push_campaign_history(limit: int = 20) -> dict[str, Any]:
    safe_limit = max(1, min(int(limit or 20), 200))
    with _LOCK:
        items = [dict(item) for item in list(_CAMPAIGN_HISTORY)[-safe_limit:]]
    items.reverse()
    return {'items': items, 'count': len(items)}


def get_push_campaign_detail(campaign_id: str) -> dict[str, Any]:
    normalized_campaign_id = str(campaign_id or '').strip()
    if not normalized_campaign_id:
        raise ValueError('Campaign id is required.')

    item = _get_campaign_history_item(normalized_campaign_id)
    if not item:
        raise ValueError('Push campaign not found.')

    return {'campaign': item}


def export_push_campaign_history_csv(limit: int = 100) -> str:
    history = list_push_campaign_history(limit).get('items', [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'campaign_id',
        'status',
        'title',
        'target_user_id',
        'delivery_mode',
        'target_count',
        'delivered_count',
        'queued_count',
        'failed_count',
        'stale_removed_count',
        'delivery_rate',
        'queued_at',
        'started_at',
        'completed_at',
        'error',
    ])

    for item in history:
        writer.writerow([
            item.get('campaign_id') or '',
            item.get('status') or '',
            item.get('title') or '',
            item.get('target_user_id') or '',
            item.get('delivery_mode') or '',
            item.get('target_count') or 0,
            item.get('delivered_count') or 0,
            item.get('queued_count') or 0,
            item.get('failed_count') or 0,
            item.get('stale_removed_count') or 0,
            item.get('delivery_rate') or 0,
            item.get('queued_at') or '',
            item.get('started_at') or '',
            item.get('completed_at') or '',
            item.get('error') or '',
        ])

    return output.getvalue()


def list_push_policy_history(
    limit: int = 50,
    action: str | None = None,
    source: str | None = None,
    actor_user_id: str | None = None,
) -> dict[str, Any]:
    safe_limit = max(1, min(int(limit or 50), 300))

    normalized_action = str(action or '').strip() or None
    normalized_source = str(source or '').strip() or None
    normalized_actor_user_id = str(actor_user_id or '').strip() or None

    if db_state.enabled:
        try:
            _ensure_policy_audit_table()
            where_clauses: list[str] = []
            params: list[Any] = []

            if normalized_action:
                where_clauses.append('action = %s')
                params.append(normalized_action)
            if normalized_source:
                where_clauses.append('source = %s')
                params.append(normalized_source)
            if normalized_actor_user_id:
                where_clauses.append('actor_user_id = %s')
                params.append(normalized_actor_user_id)

            where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ''
            sql = f'''
                SELECT
                    id::text AS id,
                    action,
                    actor_user_id,
                    source,
                    reason,
                    details,
                    created_at
                FROM push_policy_audit
                {where_sql}
                ORDER BY created_at DESC
                LIMIT %s
            '''
            params.append(safe_limit)
            rows = query_all(sql, tuple(params))
            return {
                'items': [
                    {
                        'id': str(row.get('id') or ''),
                        'action': str(row.get('action') or ''),
                        'actor_user_id': str(row.get('actor_user_id') or '').strip() or None,
                        'source': str(row.get('source') or ''),
                        'reason': str(row.get('reason') or '').strip() or None,
                        'details': row.get('details') if isinstance(row.get('details'), dict) else {},
                        'created_at': str(row.get('created_at') or ''),
                    }
                    for row in rows
                ],
                'count': len(rows),
            }
        except Exception:
            pass

    with _LOCK:
        items = [dict(item) for item in list(_POLICY_AUDIT_HISTORY)[-safe_limit:]]
    items.reverse()

    filtered: list[dict[str, Any]] = []
    for item in items:
        if normalized_action and str(item.get('action') or '') != normalized_action:
            continue
        if normalized_source and str(item.get('source') or '') != normalized_source:
            continue
        if normalized_actor_user_id and str(item.get('actor_user_id') or '') != normalized_actor_user_id:
            continue
        filtered.append(item)
        if len(filtered) >= safe_limit:
            break

    return {'items': filtered, 'count': len(filtered)}


def export_push_policy_history_csv(
    limit: int = 300,
    action: str | None = None,
    source: str | None = None,
    actor_user_id: str | None = None,
) -> str:
    history = list_push_policy_history(
        limit=limit,
        action=action,
        source=source,
        actor_user_id=actor_user_id,
    ).get('items', [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'id',
        'action',
        'actor_user_id',
        'source',
        'reason',
        'details_json',
        'created_at',
    ])

    for item in history:
        writer.writerow([
            item.get('id') or '',
            item.get('action') or '',
            item.get('actor_user_id') or '',
            item.get('source') or '',
            item.get('reason') or '',
            json.dumps(item.get('details') or {}, ensure_ascii=False),
            item.get('created_at') or '',
        ])

    return output.getvalue()
