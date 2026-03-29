from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .db import db_state, execute, query_all, query_one


AGENT_NAMES = {
    'discovery_agent',
    'evaluation_agent',
    'content_agent',
    'recommendation_agent',
    'monitoring_agent',
    'trend_agent',
    'comparison_agent',
}

_in_memory_runs: list[dict[str, Any]] = []
_runtime_state: dict[str, dict[str, Any]] = {}
_jobs_queue: asyncio.Queue | None = None
_worker_task: asyncio.Task | None = None


AGENT_STAGE_MAP: dict[str, list[str]] = {
    'discovery_agent': ['crawl_sources', 'extract_metadata', 'deduplicate', 'persist_candidates'],
    'evaluation_agent': ['collect_metrics', 'score_performance', 'score_value', 'persist_scores'],
    'content_agent': ['summarize_tool_data', 'generate_descriptions', 'refresh_pros_cons', 'persist_content'],
    'recommendation_agent': ['parse_intent', 'rank_candidates', 'assemble_stack', 'persist_recommendation'],
    'monitoring_agent': ['probe_health', 'detect_changes', 'publish_updates', 'persist_status'],
    'trend_agent': ['collect_signals', 'analyze_velocity', 'compute_trends', 'persist_trends'],
    'comparison_agent': ['fetch_tool_profiles', 'generate_matrix', 'rank_differences', 'persist_comparison'],
}


def _now() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _to_iso(value: Any) -> Any:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat().replace('+00:00', 'Z')
    return value


def _serialize_run(run: dict[str, Any]) -> dict[str, Any]:
    return {
        **run,
        'started_at': _to_iso(run.get('started_at')),
        'completed_at': _to_iso(run.get('completed_at')),
    }


def _merge_runtime(run: dict[str, Any]) -> dict[str, Any]:
    serialized_run = _serialize_run(run)
    runtime = _runtime_state.get(run['id'])
    if not runtime:
        return serialized_run
    return {
        **serialized_run,
        'lifecycle_status': runtime.get('lifecycle_status'),
        'progress_percent': runtime.get('progress_percent', 0),
        'current_stage': runtime.get('current_stage'),
        'queued_at': runtime.get('queued_at'),
    }


def _queue_size() -> int:
    return _jobs_queue.qsize() if _jobs_queue else 0


def _running_count() -> int:
    return len([state for state in _runtime_state.values() if state.get('lifecycle_status') == 'running'])


def _seed_persistent_run(run: dict[str, Any]) -> None:
    execute(
        '''
        INSERT INTO agent_runs (id, agent_name, status, started_at, completed_at, tools_processed, tools_added, tools_updated, error_log)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''',
        (
            run['id'],
            run['agent_name'],
            'running',
            run['started_at'],
            None,
            0,
            0,
            0,
            None,
        ),
    )


def _update_persistent_run(run: dict[str, Any], status: str | None = None, complete: bool = False) -> None:
    execute(
        '''
        UPDATE agent_runs
        SET
          status = COALESCE(%s::agent_status_enum, status),
          completed_at = CASE WHEN %s THEN %s ELSE completed_at END,
          tools_processed = %s,
          tools_added = %s,
          tools_updated = %s,
          error_log = %s
        WHERE id = %s
        ''',
        (
            status,
            complete,
            _now() if complete else None,
            run['tools_processed'],
            run['tools_added'],
            run['tools_updated'],
            run['error_log'],
            run['id'],
        ),
    )


def _persist_run_progress(run: dict[str, Any]) -> None:
    if db_state.enabled:
        _update_persistent_run(run)
    else:
        existing = next((item for item in _in_memory_runs if item['id'] == run['id']), None)
        if existing:
            existing.update(run)
        else:
            _in_memory_runs.insert(0, run)
            _in_memory_runs[:] = _in_memory_runs[:100]


async def _simulate_job_processing(run: dict[str, Any], payload: dict[str, Any]) -> None:
    stages = AGENT_STAGE_MAP.get(run['agent_name'], ['prepare', 'execute', 'finalize'])
    total_items = int(payload.get('tools_processed', max(8, len(stages) * 4)))
    added_target = int(payload.get('tools_added', max(1, total_items // 10)))
    updated_target = int(payload.get('tools_updated', max(2, total_items // 3)))

    for index, stage in enumerate(stages, start=1):
        await asyncio.sleep(0.8)
        progress = int(index * 100 / len(stages))
        processed = min(total_items, int(index * total_items / len(stages)))

        run['tools_processed'] = processed
        run['tools_added'] = min(added_target, max(0, int(processed * added_target / max(total_items, 1))))
        run['tools_updated'] = min(updated_target, max(0, int(processed * updated_target / max(total_items, 1))))

        _runtime_state[run['id']].update(
            {
                'lifecycle_status': 'running',
                'current_stage': stage,
                'progress_percent': progress,
                'updated_at': _now(),
            }
        )
        _persist_run_progress(run)


async def _worker_loop() -> None:
    assert _jobs_queue is not None

    while True:
        run, payload = await _jobs_queue.get()
        try:
            _runtime_state[run['id']].update(
                {
                    'lifecycle_status': 'running',
                    'current_stage': 'starting',
                    'progress_percent': 0,
                    'updated_at': _now(),
                }
            )
            await _simulate_job_processing(run, payload)

            run['status'] = 'success'
            run['completed_at'] = _now()
            run['error_log'] = None

            _runtime_state[run['id']].update(
                {
                    'lifecycle_status': 'success',
                    'current_stage': 'completed',
                    'progress_percent': 100,
                    'updated_at': _now(),
                }
            )

            if db_state.enabled:
                _update_persistent_run(run, status='success', complete=True)
            else:
                _persist_run_progress(run)
        except Exception as error:
            run['status'] = 'failed'
            run['completed_at'] = _now()
            run['error_log'] = str(error)

            _runtime_state[run['id']].update(
                {
                    'lifecycle_status': 'failed',
                    'current_stage': 'failed',
                    'progress_percent': _runtime_state[run['id']].get('progress_percent', 0),
                    'updated_at': _now(),
                }
            )

            if db_state.enabled:
                _update_persistent_run(run, status='failed', complete=True)
            else:
                _persist_run_progress(run)
        finally:
            _jobs_queue.task_done()


async def initialize_worker() -> None:
    global _jobs_queue, _worker_task
    if _jobs_queue is None:
        _jobs_queue = asyncio.Queue()
    if _worker_task is None or _worker_task.done():
        _worker_task = asyncio.create_task(_worker_loop())


async def shutdown_worker() -> None:
    global _worker_task
    if _worker_task and not _worker_task.done():
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass


async def trigger_agent(agent_name: str, payload: dict | None = None) -> dict:
    normalized = agent_name.strip().lower()
    if normalized not in AGENT_NAMES:
        raise ValueError('invalid_agent_name')

    if _jobs_queue is None:
        raise RuntimeError('worker_not_initialized')

    payload_data = payload or {}

    run = {
        'id': str(uuid4()),
        'agent_name': normalized,
        'status': 'running',
        'started_at': _now(),
        'completed_at': None,
        'tools_processed': 0,
        'tools_added': 0,
        'tools_updated': 0,
        'error_log': None,
    }

    _runtime_state[run['id']] = {
        'lifecycle_status': 'queued',
        'progress_percent': 0,
        'current_stage': 'queued',
        'queued_at': _now(),
        'updated_at': _now(),
    }

    if db_state.enabled:
        _seed_persistent_run(run)
    else:
        _in_memory_runs.insert(0, run)
        _in_memory_runs[:] = _in_memory_runs[:100]

    await _jobs_queue.put((run, payload_data))
    return _merge_runtime(run)


def get_agent_run(run_id: str) -> dict | None:
    run: dict | None = None
    if db_state.enabled:
        run = query_one(
            '''
            SELECT id::text, agent_name, status::text, started_at, completed_at, tools_processed, tools_added, tools_updated, error_log
            FROM agent_runs
            WHERE id = %s
            LIMIT 1
            ''',
            (run_id,),
        )
    else:
        run = next((item for item in _in_memory_runs if item['id'] == run_id), None)

    if not run:
        return None
    return _merge_runtime(run)


def get_agent_runs(limit: int = 20) -> list[dict]:
    clamped_limit = max(1, min(limit, 100))
    if db_state.enabled:
        rows = query_all(
            '''
            SELECT id::text, agent_name, status::text, started_at, completed_at, tools_processed, tools_added, tools_updated, error_log
            FROM agent_runs
            ORDER BY started_at DESC
            LIMIT %s
            ''',
            (clamped_limit,),
        )
        return [_merge_runtime(row) for row in rows]
    return [_merge_runtime(row) for row in _in_memory_runs[:clamped_limit]]


def pipeline_status() -> dict:
    runs = get_agent_runs(limit=10)
    latest = runs[0] if runs else None
    success_count = len([run for run in runs if run.get('status') == 'success'])
    failed_count = len([run for run in runs if run.get('status') == 'failed'])

    return {
        'latest_run': latest,
        'recent_success_count': success_count,
        'recent_failed_count': failed_count,
        'running_count': _running_count(),
        'queue_length': _queue_size(),
        'supported_agents': sorted(AGENT_NAMES),
    }
