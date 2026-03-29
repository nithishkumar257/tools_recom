import { fetchRecentAgentToolEvents, logAgentToolEvents } from './supabaseClient';

const AUDIT_SNAPSHOT_KEY = 'ai_brutal_agent_audit_snapshot_v1';
const EVENT_LOG_KEY = 'ai_brutal_agent_event_log_v1';
const UNSYNCED_EVENTS_KEY = 'ai_brutal_unsynced_events_v1';
const SYNC_STATUS_KEY = 'ai_brutal_sync_status_v1';

function safeReadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function updateSyncStatus(patch = {}) {
  const current = safeReadJson(SYNC_STATUS_KEY, {});
  const next = {
    ...current,
    ...patch,
  };
  safeWriteJson(SYNC_STATUS_KEY, next);
  return next;
}

export function getSyncHealthStatus() {
  const pendingEvents = safeReadJson(UNSYNCED_EVENTS_KEY, []);
  const syncStatus = safeReadJson(SYNC_STATUS_KEY, {});

  return {
    queuedCount: Array.isArray(pendingEvents) ? pendingEvents.length : 0,
    lastAttemptAt: syncStatus.lastAttemptAt || null,
    lastSuccessAt: syncStatus.lastSuccessAt || null,
    lastError: syncStatus.lastError || '',
    syncedTotal: Number(syncStatus.syncedTotal || 0),
    lastBatchSynced: Number(syncStatus.lastBatchSynced || 0),
  };
}

function getDaysSince(dateValue) {
  if (!dateValue) return 365;
  const millis = Date.now() - new Date(dateValue).getTime();
  if (Number.isNaN(millis)) return 365;
  return Math.max(0, Math.floor(millis / (1000 * 60 * 60 * 24)));
}

function computeEngagementBoost(eventCount) {
  if (!eventCount) return 0;
  return Math.min(1.5, Math.log10(eventCount + 1));
}

function computeFeedbackBoost(netFeedback) {
  if (!netFeedback) return 0;
  return Math.max(-1.2, Math.min(1.2, netFeedback * 0.15));
}

function getRecentEvents(days = 7) {
  const events = safeReadJson(EVENT_LOG_KEY, []);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const filtered = events.filter((entry) => {
    const timestamp = Number(entry?.timestamp || 0);
    return timestamp > cutoff;
  });

  if (filtered.length !== events.length) {
    safeWriteJson(EVENT_LOG_KEY, filtered);
  }

  return filtered;
}

function toEventTimestamp(event) {
  if (event?.timestamp) return Number(event.timestamp);
  if (event?.created_at) return new Date(event.created_at).getTime();
  return 0;
}

function normalizeEventShape(event) {
  if (!event) return null;

  if (event.toolId || event.type) {
    return {
      toolId: String(event.toolId || ''),
      type: String(event.type || ''),
      timestamp: Number(event.timestamp || Date.now()),
    };
  }

  if (event.tool_id || event.event_type) {
    return {
      toolId: String(event.tool_id || ''),
      type: String(event.event_type || ''),
      timestamp: Number(new Date(event.created_at || Date.now()).getTime()),
    };
  }

  return null;
}

async function fetchMergedEvents(days = 30) {
  const localEvents = getRecentEvents(days).map(normalizeEventShape).filter(Boolean);

  try {
    const remoteEvents = await fetchRecentAgentToolEvents(days, 6000);
    const normalizedRemoteEvents = (remoteEvents || [])
      .map(normalizeEventShape)
      .filter(Boolean);

    if (normalizedRemoteEvents.length === 0) {
      return localEvents;
    }

    const dedupe = new Map();
    [...localEvents, ...normalizedRemoteEvents].forEach((event) => {
      const key = `${event.toolId}:${event.type}:${event.timestamp}`;
      dedupe.set(key, event);
    });

    return Array.from(dedupe.values());
  } catch {
    return localEvents;
  }
}

async function syncPendingEventsToSupabase() {
  const pendingEvents = safeReadJson(UNSYNCED_EVENTS_KEY, []);
  if (!Array.isArray(pendingEvents) || pendingEvents.length === 0) return;

  updateSyncStatus({
    lastAttemptAt: new Date().toISOString(),
    lastError: '',
  });

  const batch = pendingEvents.slice(0, 200).map((event) => ({
    tool_id: event.toolId,
    event_type: event.type,
    created_at: new Date(event.timestamp || Date.now()).toISOString(),
    metadata: {},
  }));

  try {
    await logAgentToolEvents(batch);
    const remaining = pendingEvents.slice(batch.length);
    safeWriteJson(UNSYNCED_EVENTS_KEY, remaining);
    const previous = safeReadJson(SYNC_STATUS_KEY, {});
    updateSyncStatus({
      lastSuccessAt: new Date().toISOString(),
      lastBatchSynced: batch.length,
      syncedTotal: Number(previous.syncedTotal || 0) + batch.length,
      lastError: '',
    });
  } catch {
    updateSyncStatus({
      lastError: 'Sync failed. Retrying automatically.',
      lastBatchSynced: 0,
    });
    // keep pending events for next sync cycle
  }
}

export function trackToolEvent(toolId, type = 'open') {
  if (!toolId || typeof window === 'undefined') return;

  const events = safeReadJson(EVENT_LOG_KEY, []);
  const nextEvent = {
    toolId,
    type,
    timestamp: Date.now(),
  };

  events.push(nextEvent);

  if (events.length > 1200) {
    events.splice(0, events.length - 1200);
  }

  safeWriteJson(EVENT_LOG_KEY, events);

  const unsynced = safeReadJson(UNSYNCED_EVENTS_KEY, []);
  unsynced.push(nextEvent);
  if (unsynced.length > 2000) {
    unsynced.splice(0, unsynced.length - 2000);
  }
  safeWriteJson(UNSYNCED_EVENTS_KEY, unsynced);
}

export function trackRecommendationFeedback(toolIds = [], sentiment = 'helpful') {
  if (!Array.isArray(toolIds) || toolIds.length === 0) return;
  const eventType = sentiment === 'helpful' ? 'feedback_helpful' : 'feedback_not_helpful';

  toolIds
    .filter(Boolean)
    .slice(0, 5)
    .forEach((toolId) => {
      trackToolEvent(toolId, eventType);
    });
}

export async function runAgentAudit(tools = []) {
  await syncPendingEventsToSupabase();

  const mergedEvents = await fetchMergedEvents(30);

  const eventMap = new Map();
  const feedbackMap = new Map();

  const sevenDaysCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  mergedEvents.forEach((event) => {
    const toolId = String(event?.toolId || '');
    if (!toolId) return;

    const timestamp = toEventTimestamp(event);
    if (timestamp > sevenDaysCutoff) {
      eventMap.set(toolId, (eventMap.get(toolId) || 0) + 1);
    }

    if (event.type === 'feedback_helpful') {
      feedbackMap.set(toolId, (feedbackMap.get(toolId) || 0) + 1);
    }
    if (event.type === 'feedback_not_helpful') {
      feedbackMap.set(toolId, (feedbackMap.get(toolId) || 0) - 1);
    }
  });

  const scoredTools = tools.map((tool) => {
    const baseScore = Number(tool?.score || 50) / 10;
    const trendBoost = tool?.trending ? 0.8 : 0.2;
    const recencyBoost = Math.max(0, 1.2 - getDaysSince(tool?.lastUpdated) / 180);
    const engagementBoost = computeEngagementBoost(eventMap.get(tool?.id) || 0);
    const netFeedback = feedbackMap.get(tool?.id) || 0;
    const feedbackBoost = computeFeedbackBoost(netFeedback);

    const agentScore = Number((baseScore + trendBoost + recencyBoost + engagementBoost + feedbackBoost).toFixed(2));
    const delta = Number((engagementBoost + trendBoost + feedbackBoost - 0.5).toFixed(2));

    let health = 'stable';
    if (agentScore >= 10.5) health = 'excellent';
    else if (agentScore <= 6.5) health = 'watch';

    return {
      id: tool.id,
      name: tool.name,
      category: tool.category,
      agentScore,
      delta,
      health,
      eventCount: eventMap.get(tool.id) || 0,
      feedbackScore: netFeedback,
    };
  });

  scoredTools.sort((a, b) => b.agentScore - a.agentScore);

  const avgScore = scoredTools.length
    ? Number((scoredTools.reduce((sum, item) => sum + item.agentScore, 0) / scoredTools.length).toFixed(2))
    : 0;

  const improvingCount = scoredTools.filter((item) => item.delta > 0.35).length;
  const decliningCount = scoredTools.filter((item) => item.delta < -0.15).length;
  const weeklyEvents = Array.from(eventMap.values()).reduce((sum, count) => sum + count, 0);
  const helpfulVotes = Array.from(feedbackMap.values()).filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
  const notHelpfulVotes = Array.from(feedbackMap.values()).filter((value) => value < 0).reduce((sum, value) => sum + Math.abs(value), 0);

  const estimatedMRR = Math.round(99 + weeklyEvents * 3 + improvingCount * 6 + helpfulVotes * 2 - notHelpfulVotes);

  const snapshot = {
    updatedAt: new Date().toISOString(),
    scores: scoredTools,
    summary: {
      trackedTools: scoredTools.length,
      avgScore,
      improvingCount,
      decliningCount,
      weeklyEvents,
      helpfulVotes,
      notHelpfulVotes,
      sync: getSyncHealthStatus(),
    },
    monetization: {
      starterPlan: '$12/mo',
      growthPlan: '$39/mo',
      enterprisePlan: '$129/mo',
      estimatedMRR,
      conversionHint: improvingCount > decliningCount ? 'Upsell growth plan on high-performing categories' : 'Promote starter trial to boost adoption',
    },
  };

  safeWriteJson(AUDIT_SNAPSHOT_KEY, snapshot);
  return snapshot;
}

export function getLatestAuditSnapshot() {
  return safeReadJson(AUDIT_SNAPSHOT_KEY, null);
}

export function startContinuousAudit(tools, onUpdate, intervalMs = 120000) {
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const snapshot = await runAgentAudit(tools);
      onUpdate?.(snapshot);
    } finally {
      isRunning = false;
    }
  };

  void run();
  const timerId = setInterval(() => {
    void run();
  }, intervalMs);

  return () => clearInterval(timerId);
}
