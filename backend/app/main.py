from __future__ import annotations

import asyncio
import json
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from .agent_service import get_agent_run, get_agent_runs, initialize_worker, pipeline_status, shutdown_worker, trigger_agent
from .auth import require_authenticated_user
from .cache_service import cache_stats, invalidate_cache
from .catalog_service import (
    add_bookmark,
    add_tool_to_collection,
    compare_tools,
    create_collection,
    delete_collection,
    get_new,
    get_tool_by_slug,
    get_top,
    get_trending,
    list_bookmarks,
    list_collections,
    list_categories,
    list_notifications,
    list_public_tools,
    list_reviews,
    list_tools,
    personalized_feed,
    recommend_stack,
    remove_bookmark,
    remove_tool_from_collection,
    submit_review,
    submit_tool,
    tool_analytics,
)
from .comparison_service import build_comparison_matrix, get_comparison_state
from .config import settings
from .content_service import get_content_status, refresh_content
from .db import database_status, init_database
from .discovery_service import configure_discovery_scheduler, get_discovery_status, ingest_discovery_candidates, trigger_discovery_state_mark
from .event_service import list_events
from .evaluation_service import get_evaluation_status, refresh_evaluation_scores
from .monitoring_service import get_monitoring_status, list_monitoring_alerts, run_monitoring_probe
from .push_service import (
    configure_push_scheduler,
    export_push_campaign_history_csv,
    export_push_policy_history_csv,
    get_push_campaign_detail,
    get_push_campaign_status,
    get_push_delivery_metrics,
    initialize_push_delivery_worker,
    list_push_campaign_history,
    list_push_policy_history,
    list_push_subscriptions,
    queue_push_campaign,
    remove_push_subscription,
    run_push_scheduler_tick,
    set_auto_resume_lock,
    shutdown_push_delivery_worker,
    trigger_test_push,
    upsert_push_subscription,
)
from .trend_service import get_trend_insights
from .user_profile_service import get_user_profile_preferences, update_user_profile_preferences


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'] if settings.cors_origin == '*' else [settings.cors_origin],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
async def startup_event() -> None:
    init_database()
    await initialize_worker()
    initialize_push_delivery_worker()


@app.on_event('shutdown')
async def shutdown_event() -> None:
    await shutdown_worker()
    shutdown_push_delivery_worker()


@app.get('/health')
def health() -> dict:
    return {
        'status': 'ok',
        'service': settings.app_name,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'database': database_status(),
    }


@app.get('/v1/tools')
def tools(
    page: int = 1,
    limit: int = 20,
    category: str = 'All',
    pricing: str | None = None,
    q: str | None = None,
    trending: str | None = None,
    sort: str = 'score',
) -> dict:
    return list_tools(
        {
            'page': page,
            'limit': limit,
            'category': category,
            'pricing': pricing,
            'q': q,
            'trending': trending,
            'sort': sort,
        }
    )


@app.get('/v1/tools/search')
def search_tools(q: str = '', page: int = 1, limit: int = 20, category: str = 'All', pricing: str | None = None, sort: str = 'score') -> dict:
    return list_tools(
        {
            'page': page,
            'limit': limit,
            'category': category,
            'pricing': pricing,
            'q': q,
            'sort': sort,
        }
    )


@app.get('/v1/tools/trending')
def trending_tools() -> dict:
    return {'items': get_trending()}


@app.get('/v1/tools/new')
def new_tools() -> dict:
    return {'items': get_new()}


@app.get('/v1/tools/top')
def top_tools(count: int = 10, sortBy: str = 'score') -> dict:
    return {'items': get_top(count, sortBy)}


@app.get('/v1/tools/{slug}')
def tool_by_slug(slug: str) -> dict:
    tool = get_tool_by_slug(slug)
    if not tool:
        raise HTTPException(status_code=404, detail=f"No tool found for slug '{slug}'.")
    return tool

@app.get('/v1/tools/{slug}/reviews')
def tool_reviews(slug: str, limit: int = 20) -> dict:
    return list_reviews(slug, limit)

@app.post('/v1/tools/{slug}/reviews')
def submit_tool_review(slug: str, payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return submit_review(user, slug, payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/analytics/tools/{slug}')
def tool_maker_analytics(slug: str, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return tool_analytics(user, slug)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post('/v1/tools/submit')
def submit_tool_listing(payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        item = submit_tool(payload, user)
        return {'item': item, 'message': 'Tool submitted successfully.'}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/categories')
def categories() -> dict:
    return {'items': list_categories()}


@app.get('/v1/public/tools')
def public_tools(
    page: int = 1,
    limit: int = 20,
    category: str = 'All',
    pricing: str | None = None,
    q: str | None = None,
    trending: str | None = None,
    sort: str = 'score',
) -> dict:
    return list_public_tools(
        {
            'page': page,
            'limit': limit,
            'category': category,
            'pricing': pricing,
            'q': q,
            'trending': trending,
            'sort': sort,
        }
    )


@app.get('/v1/public/categories')
def public_categories() -> dict:
    return {'items': list_categories()}


@app.get('/v1/public/tools/{slug}')
def public_tool_detail(slug: str) -> dict:
    tool = get_tool_by_slug(slug)
    if not tool:
        raise HTTPException(status_code=404, detail=f"No tool found for slug '{slug}'.")
    return {
        'item': {
            'id': tool.get('id'),
            'slug': tool.get('slug') or tool.get('id'),
            'name': tool.get('name'),
            'category': tool.get('category') or 'General',
            'description': tool.get('description') or '',
            'url': tool.get('url'),
            'pricing': tool.get('pricing'),
            'pricing_model': tool.get('pricing_model'),
            'score': int(tool.get('score') or 0),
            'trending': bool(tool.get('trending')),
            'last_updated': tool.get('lastUpdated'),
        }
    }


@app.get('/v1/categories/{slug}/tools')
def tools_by_category_slug(slug: str, page: int = 1, limit: int = 20, pricing: str | None = None, q: str | None = None, sort: str = 'score') -> dict:
    category = ' '.join(part.capitalize() for part in slug.split('-'))
    return list_tools(
        {
            'page': page,
            'limit': limit,
            'category': category,
            'pricing': pricing,
            'q': q,
            'sort': sort,
        }
    )


@app.get('/v1/bookmarks')
def bookmarks(user: dict = Depends(require_authenticated_user)) -> dict:
    return list_bookmarks(user)


@app.post('/v1/bookmarks/{tool_slug}')
def bookmark_tool(tool_slug: str, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return add_bookmark(user, tool_slug)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.delete('/v1/bookmarks/{tool_slug}')
def unbookmark_tool(tool_slug: str, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return remove_bookmark(user, tool_slug)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/collections')
def collections(user: dict = Depends(require_authenticated_user)) -> dict:
    return list_collections(user)


@app.get('/v1/feed/personalized')
def user_personalized_feed(limit: int = 10, user: dict = Depends(require_authenticated_user)) -> dict:
    preferences = get_user_profile_preferences(user)
    return personalized_feed(user, limit, preferences)


@app.get('/v1/notifications')
def user_notifications(limit: int = 10, user: dict = Depends(require_authenticated_user)) -> dict:
    preferences = get_user_profile_preferences(user)
    return list_notifications(user, limit, preferences)


@app.get('/v1/notifications/subscriptions')
def notification_subscriptions(user: dict = Depends(require_authenticated_user)) -> dict:
    return list_push_subscriptions(user)


@app.post('/v1/notifications/subscriptions')
def save_notification_subscription(payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return upsert_push_subscription(user, payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.delete('/v1/notifications/subscriptions')
def delete_notification_subscription(payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    endpoint = str(payload.get('endpoint') or '').strip()
    try:
        return remove_push_subscription(user, endpoint)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post('/v1/notifications/test')
def notification_test_push(payload: dict | None = None, user: dict = Depends(require_authenticated_user)) -> dict:
    return trigger_test_push(user, payload)


@app.get('/v1/admin/push/status')
def admin_push_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_push_campaign_status()


@app.get('/v1/admin/push/metrics')
def admin_push_metrics(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_push_delivery_metrics()


@app.get('/v1/admin/push/campaigns')
def admin_push_campaigns(limit: int = 20, _user: dict = Depends(require_authenticated_user)) -> dict:
    return list_push_campaign_history(limit)


@app.get('/v1/admin/push/campaigns/export.csv')
def admin_push_campaigns_csv(limit: int = 100, _user: dict = Depends(require_authenticated_user)) -> Response:
    content = export_push_campaign_history_csv(limit)
    return Response(
        content=content,
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="push-campaign-history.csv"'},
    )


@app.get('/v1/admin/push/policy/history')
def admin_push_policy_history(
    limit: int = 50,
    action: str | None = None,
    source: str | None = None,
    actor_user_id: str | None = None,
    _user: dict = Depends(require_authenticated_user),
) -> dict:
    return list_push_policy_history(
        limit=limit,
        action=action,
        source=source,
        actor_user_id=actor_user_id,
    )


@app.get('/v1/admin/push/policy/history/export.csv')
def admin_push_policy_history_csv(
    limit: int = 300,
    action: str | None = None,
    source: str | None = None,
    actor_user_id: str | None = None,
    _user: dict = Depends(require_authenticated_user),
) -> Response:
    content = export_push_policy_history_csv(
        limit=limit,
        action=action,
        source=source,
        actor_user_id=actor_user_id,
    )
    return Response(
        content=content,
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="push-policy-history.csv"'},
    )


@app.get('/v1/admin/push/campaigns/{campaign_id}')
def admin_push_campaign_detail(campaign_id: str, _user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return get_push_campaign_detail(campaign_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from None


@app.post('/v1/admin/push/campaign')
def admin_push_campaign(payload: dict | None = None, _user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return queue_push_campaign(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post('/v1/admin/push/scheduler')
def admin_push_scheduler(payload: dict | None = None, _user: dict = Depends(require_authenticated_user)) -> dict:
    data = dict(payload or {})
    data['actor_user_id'] = str(_user.get('id') or '')
    data['source'] = 'admin_api'
    return configure_push_scheduler(data)


@app.post('/v1/admin/push/scheduler/tick')
def admin_push_scheduler_tick(payload: dict | None = None, _user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return run_push_scheduler_tick(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post('/v1/admin/push/policy/auto-resume-lock')
def admin_push_auto_resume_lock(payload: dict | None = None, _user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        data = dict(payload or {})
        data['actor_user_id'] = str(_user.get('id') or '')
        data['source'] = 'admin_api'
        return set_auto_resume_lock(data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/profile/preferences')
def user_profile_preferences(user: dict = Depends(require_authenticated_user)) -> dict:
    return {'preferences': get_user_profile_preferences(user)}


@app.put('/v1/profile/preferences')
def update_profile_preferences(payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        preferences = update_user_profile_preferences(user, payload)
        return {'preferences': preferences, 'message': 'Profile preferences updated.'}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/trends/insights')
def trend_insights(limit: int = 6, _user: dict = Depends(require_authenticated_user)) -> dict:
    return get_trend_insights(limit)


@app.post('/v1/collections')
def create_user_collection(payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        item = create_collection(user, payload)
        return {'item': item, 'message': 'Collection created.'}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.delete('/v1/collections/{collection_id}')
def delete_user_collection(collection_id: str, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return delete_collection(user, collection_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post('/v1/collections/{collection_id}/tools/{tool_slug}')
def add_collection_tool(collection_id: str, tool_slug: str, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return add_tool_to_collection(user, collection_id, tool_slug)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.delete('/v1/collections/{collection_id}/tools/{tool_slug}')
def remove_collection_tool(collection_id: str, tool_slug: str, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return remove_tool_from_collection(user, collection_id, tool_slug)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post('/v1/recommend/stack')
def recommend(payload: dict) -> dict:
    query_text = str(payload.get('query', '')).strip()
    if not query_text:
        raise HTTPException(status_code=400, detail='Body field "query" is required.')

    budget = str(payload.get('budget', 'mixed')).lower()
    if budget not in {'free', 'mixed', 'premium'}:
        raise HTTPException(status_code=400, detail='Budget must be one of: free, mixed, premium.')

    category = str(payload.get('category', 'All'))
    follow_up_answers = payload.get('follow_up_answers')
    if not isinstance(follow_up_answers, dict):
        follow_up_answers = None
    return recommend_stack(query_text, budget, category, follow_up_answers)


@app.get('/v1/compare')
def compare(tools: str) -> dict:
    slug_list = []
    for part in str(tools or '').split(','):
        value = part.strip().lower()
        if value and value not in slug_list:
            slug_list.append(value)

    if len(slug_list) < 2:
        raise HTTPException(status_code=400, detail='Provide at least two tool slugs in tools query parameter.')
    if len(slug_list) > 5:
        raise HTTPException(status_code=400, detail='You can compare at most five tools at a time.')

    return compare_tools(slug_list)


@app.websocket('/v1/ws/tools/feed')
async def websocket_tools_feed(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            try:
                tools_snapshot = list_tools({'limit': 60, 'sort': 'score'}).get('items', [])
                categories_snapshot = list_categories()
            except Exception:
                # Fallback to empty list if database is unavailable
                tools_snapshot = []
                categories_snapshot = []
            
            payload = {
                'event': 'tools.feed.snapshot',
                'generated_at': datetime.utcnow().isoformat() + 'Z',
                'items': tools_snapshot,
                'categories': categories_snapshot,
            }
            await websocket.send_json(payload)
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        return
    except Exception:
        # Close connection on any other error
        await websocket.close()


@app.post('/v1/admin/agents/trigger')
async def admin_trigger_agent(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    agent_name = str(payload.get('agent_name', '')).strip()
    if not agent_name:
        raise HTTPException(status_code=400, detail='Body field "agent_name" is required.')
    try:
        run = await trigger_agent(agent_name, payload)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid agent name.')
    except RuntimeError:
        raise HTTPException(status_code=503, detail='Agent worker not ready.')
    return {'run': run}


@app.get('/v1/admin/discovery/status')
def admin_discovery_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_discovery_status()


@app.post('/v1/admin/discovery/scheduler')
def admin_discovery_scheduler(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    enabled = bool(payload.get('enabled', False))
    interval_minutes = int(payload.get('interval_minutes', 360))
    state = configure_discovery_scheduler(enabled, interval_minutes)
    return {'state': state}


@app.post('/v1/admin/discovery/trigger')
async def admin_discovery_trigger(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        run = await trigger_agent('discovery_agent', payload or {})
        trigger_discovery_state_mark()
        return {'run': run}
    except RuntimeError:
        raise HTTPException(status_code=503, detail='Agent worker not ready.')


@app.post('/v1/admin/discovery/ingest')
def admin_discovery_ingest(payload: dict, user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return ingest_discovery_candidates(payload, user)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/admin/evaluation/status')
def admin_evaluation_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_evaluation_status()


@app.post('/v1/admin/evaluation/refresh')
def admin_evaluation_refresh(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    return refresh_evaluation_scores(payload)


@app.get('/v1/admin/content/status')
def admin_content_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_content_status()


@app.post('/v1/admin/content/refresh')
def admin_content_refresh(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    return refresh_content(payload)


@app.get('/v1/admin/comparison/status')
def admin_comparison_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_comparison_state()


@app.post('/v1/admin/comparison/matrix')
def admin_comparison_matrix(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    try:
        return build_comparison_matrix(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.get('/v1/admin/monitoring/status')
def admin_monitoring_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return get_monitoring_status()


@app.post('/v1/admin/monitoring/probe')
def admin_monitoring_probe(payload: dict, _user: dict = Depends(require_authenticated_user)) -> dict:
    return run_monitoring_probe(payload)


@app.get('/v1/admin/monitoring/alerts')
def admin_monitoring_alerts(limit: int = 50, _user: dict = Depends(require_authenticated_user)) -> dict:
    return {'items': list_monitoring_alerts(limit)}


@app.get('/v1/admin/cache/status')
def admin_cache_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return {'cache': cache_stats()}


@app.post('/v1/admin/cache/clear')
def admin_cache_clear(payload: dict | None = None, _user: dict = Depends(require_authenticated_user)) -> dict:
    data = payload or {}
    prefix = str(data.get('prefix') or '').strip() or None
    removed = invalidate_cache(prefix)
    return {'removed_count': removed, 'prefix': prefix}


@app.get('/v1/admin/agents/runs')
def admin_agent_runs(limit: int = 20, _user: dict = Depends(require_authenticated_user)) -> dict:
    return {'items': get_agent_runs(limit)}


@app.get('/v1/admin/agents/runs/{run_id}')
def admin_agent_run_detail(run_id: str, _user: dict = Depends(require_authenticated_user)) -> dict:
    run = get_agent_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail='Run not found.')
    return {'run': run}


@app.get('/v1/admin/agents/runs/{run_id}/stream')
async def admin_agent_run_stream(
    run_id: str,
    _user: dict = Depends(require_authenticated_user),
) -> StreamingResponse:
    run = get_agent_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail='Run not found.')

    async def event_generator():
        terminal_statuses = {'success', 'failed'}

        while True:
            current = get_agent_run(run_id)
            if not current:
                payload = {'run_id': run_id, 'error': 'run_not_found'}
                yield f'event: error\ndata: {json.dumps(payload)}\n\n'
                break

            payload = {'run': current}
            yield f'event: progress\ndata: {json.dumps(payload)}\n\n'

            lifecycle_status = str(current.get('lifecycle_status', '')).lower()
            if lifecycle_status in terminal_statuses:
                break

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type='text/event-stream')


@app.get('/v1/admin/pipeline/status')
def admin_pipeline_status(_user: dict = Depends(require_authenticated_user)) -> dict:
    return pipeline_status()


@app.get('/v1/admin/events')
def admin_events(limit: int = 50, _user: dict = Depends(require_authenticated_user)) -> dict:
    return {'items': list_events(limit)}


@app.get('/v1/admin/events/stream')
async def admin_events_stream(_user: dict = Depends(require_authenticated_user)) -> StreamingResponse:
    async def event_generator():
        sent_ids: set[str] = set()
        while True:
            events = list_events(150)
            fresh_events = [event for event in events if event.get('id') not in sent_ids]

            if fresh_events:
                for event in fresh_events:
                    sent_ids.add(str(event.get('id')))
                    yield f'event: admin_event\ndata: {json.dumps(event)}\n\n'
            else:
                heartbeat = {'type': 'heartbeat', 'created_at': datetime.utcnow().isoformat() + 'Z'}
                yield f'event: heartbeat\ndata: {json.dumps(heartbeat)}\n\n'

            if len(sent_ids) > 500:
                sent_ids = set(list(sent_ids)[-250:])

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type='text/event-stream')
