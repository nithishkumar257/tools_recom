import { supabase } from './supabaseClient';
import { createCoreApi } from '../shared/coreApi';
import { buildQuery, requestWithOfflineCache } from '../shared/requestHelpers';
import { createEventSourceSubscription, createReconnectableWebSocketSubscription } from '../shared/subscriptionHelpers';
import { readOfflineCache, writeOfflineCache } from './offlineCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002';

async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function request(path, options = {}, requireAuth = false) {
  const headers = new Headers(options.headers || {});
  if (requireAuth) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in.');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = typeof payload?.detail === 'string' ? payload.detail : '';
    } catch {
      detail = '';
    }

    const error = new Error(detail || `Request failed: ${response.status}`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  return response.json();
}

const coreApi = createCoreApi({
  baseUrl: API_BASE_URL,
  getAccessToken,
});

function downloadBlobAsFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchTools(params = {}) {
  const suffix = buildQuery(params || {});
  return requestWithOfflineCache({
    requester: () => request(`/v1/tools${suffix}`),
    cacheKey: `tools:${suffix}`,
    ttlMs: 7 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchCategories() {
  return requestWithOfflineCache({
    requester: () => request('/v1/categories'),
    cacheKey: 'categories:list',
    ttlMs: 30 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchTrendingTools() {
  return requestWithOfflineCache({
    requester: () => request('/v1/tools/trending'),
    cacheKey: 'tools:trending',
    ttlMs: 5 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchTopTools(params = {}) {
  const suffix = buildQuery(params || {});
  return requestWithOfflineCache({
    requester: () => request(`/v1/tools/top${suffix}`),
    cacheKey: `tools:top:${suffix}`,
    ttlMs: 5 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchToolComparison(toolSlugs = []) {
  return coreApi.fetchToolComparison(toolSlugs || []);
}

export async function fetchBookmarks() {
  return coreApi.fetchBookmarks();
}

export async function addBookmark(toolSlug) {
  return coreApi.addBookmark(toolSlug);
}

export async function removeBookmark(toolSlug) {
  return coreApi.removeBookmark(toolSlug);
}

export async function fetchCollections() {
  return coreApi.fetchCollections();
}

export async function createCollection(payload) {
  return coreApi.createCollection(payload || {});
}

export async function deleteCollection(collectionId) {
  return coreApi.deleteCollection(collectionId);
}

export async function addToolToCollection(collectionId, toolSlug) {
  return coreApi.addToolToCollection(collectionId, toolSlug);
}

export async function removeToolFromCollection(collectionId, toolSlug) {
  return coreApi.removeToolFromCollection(collectionId, toolSlug);
}

export async function fetchToolReviews(toolSlug, limit = 20) {
  return coreApi.fetchToolReviews(toolSlug, limit);
}

export async function submitToolReview(toolSlug, payload) {
  return coreApi.submitToolReview(toolSlug, payload || {});
}

export async function fetchPersonalizedFeed(limit = 10) {
  return coreApi.fetchPersonalizedFeed(limit);
}

export async function fetchNotifications(limit = 10) {
  return coreApi.fetchNotifications(limit);
}

export async function fetchNotificationSubscriptions() {
  return coreApi.fetchNotificationSubscriptions();
}

export async function upsertNotificationSubscription(payload = {}) {
  return coreApi.upsertNotificationSubscription(payload);
}

export async function removeNotificationSubscription(endpoint = '') {
  return coreApi.removeNotificationSubscription(endpoint);
}

export async function triggerNotificationTest(payload = {}) {
  return coreApi.triggerNotificationTest(payload);
}

export async function fetchProfilePreferences() {
  return coreApi.fetchProfilePreferences();
}

export async function updateProfilePreferences(payload = {}) {
  return coreApi.updateProfilePreferences(payload);
}

export async function fetchPublicTools(params = {}) {
  const suffix = buildQuery(params || {});
  return requestWithOfflineCache({
    requester: () => request(`/v1/public/tools${suffix}`),
    cacheKey: `public:tools:${suffix}`,
    ttlMs: 10 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchPublicCategories() {
  return requestWithOfflineCache({
    requester: () => request('/v1/public/categories'),
    cacheKey: 'public:categories:list',
    ttlMs: 30 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchPublicToolDetail(slug) {
  const value = String(slug || '').trim();
  if (!value) {
    throw new Error('Tool slug is required.');
  }
  return requestWithOfflineCache({
    requester: () => request(`/v1/public/tools/${encodeURIComponent(value)}`),
    cacheKey: `public:tool:${value}`,
    ttlMs: 20 * 60 * 1000,
    readCache: readOfflineCache,
    writeCache: writeOfflineCache,
  });
}

export async function fetchToolAnalytics(toolSlug) {
  return coreApi.fetchToolAnalytics(toolSlug);
}

export function subscribeToolsFeed({ onSnapshot, onError } = {}) {
  return createReconnectableWebSocketSubscription({
    createUrl: () => coreApi.buildToolsFeedWebSocketUrl(),
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === 'tools.feed.snapshot') {
          onSnapshot?.(payload);
        }
      } catch {
        onError?.(new Error('Failed to parse tools feed message.'));
      }
    },
    onError: () => {
      onError?.(new Error('Tools live feed encountered an error.'));
    },
    reconnectDelayMs: 3000,
  });
}

export async function fetchTrendInsights(limit = 6) {
  return coreApi.fetchTrendInsights(limit);
}

export async function fetchRecommendationStack(payload) {
  return coreApi.fetchRecommendationStack(payload || {});
}

export async function submitToolListing(payload) {
  return coreApi.submitToolListing(payload || {});
}

export async function triggerAgentRun(payload) {
  return coreApi.triggerAgentRun(payload || {});
}

export async function fetchDiscoveryStatus() {
  return coreApi.fetchDiscoveryStatus();
}

export async function triggerDiscoveryRun(payload = {}) {
  return coreApi.triggerDiscoveryRun(payload || {});
}

export async function configureDiscoveryScheduler(payload) {
  return coreApi.configureDiscoveryScheduler(payload || {});
}

export async function ingestDiscoveryCandidates(payload) {
  return coreApi.ingestDiscoveryCandidates(payload || {});
}

export async function fetchEvaluationStatus() {
  return coreApi.fetchEvaluationStatus();
}

export async function refreshEvaluationScores(payload = {}) {
  return coreApi.refreshEvaluationScores(payload || {});
}

export async function fetchContentStatus() {
  return coreApi.fetchContentStatus();
}

export async function refreshContent(payload = {}) {
  return coreApi.refreshContent(payload || {});
}

export async function fetchComparisonStatus() {
  return coreApi.fetchComparisonStatus();
}

export async function generateComparisonMatrix(payload = {}) {
  return coreApi.generateComparisonMatrix(payload || {});
}

export async function fetchMonitoringStatus() {
  return coreApi.fetchMonitoringStatus();
}

export async function runMonitoringProbe(payload = {}) {
  return coreApi.runMonitoringProbe(payload || {});
}

export async function fetchMonitoringAlerts(limit = 50) {
  return coreApi.fetchMonitoringAlerts(limit);
}

export async function fetchPushCampaignStatus() {
  return coreApi.fetchPushCampaignStatus();
}

export async function fetchPushDeliveryMetrics() {
  return coreApi.fetchPushDeliveryMetrics();
}

export async function fetchPushCampaignHistory(limit = 20) {
  return coreApi.fetchPushCampaignHistory(limit);
}

export async function fetchPushPolicyHistory(limit = 50, filters = {}) {
  return coreApi.fetchPushPolicyHistory(limit, filters || {});
}

export async function fetchPushCampaignDetail(campaignId) {
  return coreApi.fetchPushCampaignDetail(campaignId);
}

export async function downloadPushCampaignHistoryCsv(limit = 100) {
  const blob = await coreApi.fetchPushCampaignHistoryCsvBlob(limit);
  downloadBlobAsFile(blob, 'push-campaign-history.csv');
}

export async function downloadPushPolicyHistoryCsv(limit = 300, filters = {}) {
  const blob = await coreApi.fetchPushPolicyHistoryCsvBlob(limit, filters || {});
  downloadBlobAsFile(blob, 'push-policy-history.csv');
}

export async function queuePushCampaign(payload = {}) {
  return coreApi.queuePushCampaign(payload || {});
}

export async function configurePushScheduler(payload = {}) {
  return coreApi.configurePushScheduler(payload || {});
}

export async function runPushSchedulerTick(payload = {}) {
  return coreApi.runPushSchedulerTick(payload || {});
}

export async function updatePushAutoResumeLock(payload = {}) {
  return coreApi.updatePushAutoResumeLock(payload || {});
}

export async function fetchAdminEvents(limit = 50) {
  return coreApi.fetchAdminEvents(limit);
}

export async function subscribeAdminEvents({ onEvent, onError } = {}) {
  let streamUrl;
  try {
    streamUrl = await coreApi.buildAdminEventsStreamUrl();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Authentication required. Please sign in.'));
    return () => {};
  }

  return createEventSourceSubscription(streamUrl, {
    eventName: 'admin_event',
    onEvent: (event) => {
      try {
        const payload = JSON.parse(event.data);
        onEvent?.(payload);
      } catch {
        onError?.(new Error('Failed to parse admin event.'));
      }
    },
    onError: () => {
      onError?.(new Error('Admin event stream disconnected.'));
    },
  });
}

export async function fetchAgentRuns(limit = 10) {
  return coreApi.fetchAgentRuns(limit);
}

export async function fetchAgentRun(runId) {
  return coreApi.fetchAgentRun(runId);
}

export async function fetchPipelineStatus() {
  return coreApi.fetchPipelineStatus();
}

export async function subscribeAgentRunProgress(runId, { onProgress, onError } = {}) {
  let streamUrl;
  try {
    streamUrl = await coreApi.buildAgentRunProgressStreamUrl(runId);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Authentication required. Please sign in.'));
    return () => {};
  }

  return createEventSourceSubscription(streamUrl, {
    eventName: 'progress',
    onEvent: (event) => {
      try {
        const payload = JSON.parse(event.data);
        onProgress?.(payload);
      } catch {
        onError?.(new Error('Failed to parse progress event.'));
      }
    },
    onError: () => {
      onError?.(new Error('Live stream disconnected.'));
    },
  });
}
