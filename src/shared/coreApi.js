import { buildQuery } from './requestHelpers';

export function createCoreApi({ baseUrl, getAccessToken }) {
  async function getAuthorizationHeader() {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in.');
    }
    return `Bearer ${token}`;
  }

  async function request(path, options = {}, requireAuth = false) {
    const headers = new Headers(options.headers || {});
    if (requireAuth) {
      headers.set('Authorization', await getAuthorizationHeader());
    }

    const response = await fetch(`${baseUrl}${path}`, {
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

  async function requestBlob(path, options = {}, requireAuth = false) {
    const headers = new Headers(options.headers || {});
    if (requireAuth) {
      headers.set('Authorization', await getAuthorizationHeader());
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.blob();
  }

  async function buildAuthenticatedStreamUrl(path, params = {}) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in.');
    }

    const streamUrl = new URL(`${baseUrl}${path}`);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        streamUrl.searchParams.set(key, String(value));
      }
    });
    streamUrl.searchParams.set('access_token', token);
    return streamUrl.toString();
  }

  function buildWebSocketUrl(path) {
    const normalizedPath = String(path || '').startsWith('/') ? path : `/${String(path || '')}`;
    const targetUrl = new URL(normalizedPath, baseUrl);
    targetUrl.protocol = targetUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return targetUrl.toString();
  }

  return {
    request,
    fetchPublicTools(params = {}) {
      return request(`/v1/public/tools${buildQuery(params)}`);
    },
    fetchPublicCategories() {
      return request('/v1/public/categories');
    },
    fetchPublicToolDetail(slug) {
      const value = String(slug || '').trim();
      if (!value) {
        throw new Error('Tool slug is required.');
      }
      return request(`/v1/public/tools/${encodeURIComponent(value)}`);
    },
    fetchPersonalizedFeed(limit = 10) {
      return request(`/v1/feed/personalized${buildQuery({ limit })}`, undefined, true);
    },
    fetchNotifications(limit = 10) {
      return request(`/v1/notifications${buildQuery({ limit })}`, undefined, true);
    },
    fetchNotificationSubscriptions() {
      return request('/v1/notifications/subscriptions', undefined, true);
    },
    upsertNotificationSubscription(payload = {}) {
      return request('/v1/notifications/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    removeNotificationSubscription(endpoint = '') {
      return request('/v1/notifications/subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: String(endpoint || '').trim() }),
      }, true);
    },
    triggerNotificationTest(payload = {}) {
      return request('/v1/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchProfilePreferences() {
      return request('/v1/profile/preferences', undefined, true);
    },
    updateProfilePreferences(payload = {}) {
      return request('/v1/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchBookmarks() {
      return request('/v1/bookmarks', undefined, true);
    },
    addBookmark(toolSlug) {
      const slug = String(toolSlug || '').trim();
      if (!slug) {
        throw new Error('Tool slug is required.');
      }
      return request(`/v1/bookmarks/${encodeURIComponent(slug)}`, { method: 'POST' }, true);
    },
    removeBookmark(toolSlug) {
      const slug = String(toolSlug || '').trim();
      if (!slug) {
        throw new Error('Tool slug is required.');
      }
      return request(`/v1/bookmarks/${encodeURIComponent(slug)}`, { method: 'DELETE' }, true);
    },
    fetchCollections() {
      return request('/v1/collections', undefined, true);
    },
    createCollection(payload = {}) {
      return request('/v1/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    deleteCollection(collectionId) {
      const id = String(collectionId || '').trim();
      if (!id) {
        throw new Error('Collection id is required.');
      }
      return request(`/v1/collections/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
    },
    addToolToCollection(collectionId, toolSlug) {
      const id = String(collectionId || '').trim();
      const slug = String(toolSlug || '').trim();
      if (!id || !slug) {
        throw new Error('Collection id and tool slug are required.');
      }
      return request(`/v1/collections/${encodeURIComponent(id)}/tools/${encodeURIComponent(slug)}`, { method: 'POST' }, true);
    },
    removeToolFromCollection(collectionId, toolSlug) {
      const id = String(collectionId || '').trim();
      const slug = String(toolSlug || '').trim();
      if (!id || !slug) {
        throw new Error('Collection id and tool slug are required.');
      }
      return request(`/v1/collections/${encodeURIComponent(id)}/tools/${encodeURIComponent(slug)}`, { method: 'DELETE' }, true);
    },
    fetchPushCampaignStatus() {
      return request('/v1/admin/push/status', undefined, true);
    },
    fetchPushDeliveryMetrics() {
      return request('/v1/admin/push/metrics', undefined, true);
    },
    fetchPushCampaignHistory(limit = 20) {
      return request(`/v1/admin/push/campaigns${buildQuery({ limit })}`, undefined, true);
    },
    fetchPushCampaignDetail(campaignId) {
      const id = String(campaignId || '').trim();
      if (!id) {
        throw new Error('Campaign id is required.');
      }
      return request(`/v1/admin/push/campaigns/${encodeURIComponent(id)}`, undefined, true);
    },
    fetchPushPolicyHistory(limit = 50, filters = {}) {
      const params = {
        limit,
        action: String(filters?.action || '').trim() || undefined,
        source: String(filters?.source || '').trim() || undefined,
        actor_user_id: String(filters?.actor_user_id || '').trim() || undefined,
      };
      return request(`/v1/admin/push/policy/history${buildQuery(params)}`, undefined, true);
    },
    queuePushCampaign(payload = {}) {
      return request('/v1/admin/push/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    configurePushScheduler(payload = {}) {
      return request('/v1/admin/push/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    runPushSchedulerTick(payload = {}) {
      return request('/v1/admin/push/scheduler/tick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    updatePushAutoResumeLock(payload = {}) {
      return request('/v1/admin/push/policy/auto-resume-lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchAdminEvents(limit = 50) {
      return request(`/v1/admin/events${buildQuery({ limit })}`, undefined, true);
    },
    triggerAgentRun(payload = {}) {
      return request('/v1/admin/agents/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchAgentRuns(limit = 10) {
      return request(`/v1/admin/agents/runs${buildQuery({ limit })}`, undefined, true);
    },
    fetchAgentRun(runId) {
      const id = String(runId || '').trim();
      if (!id) {
        throw new Error('Run id is required.');
      }
      return request(`/v1/admin/agents/runs/${encodeURIComponent(id)}`, undefined, true);
    },
    fetchPipelineStatus() {
      return request('/v1/admin/pipeline/status', undefined, true);
    },
    fetchDiscoveryStatus() {
      return request('/v1/admin/discovery/status', undefined, true);
    },
    triggerDiscoveryRun(payload = {}) {
      return request('/v1/admin/discovery/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    configureDiscoveryScheduler(payload = {}) {
      return request('/v1/admin/discovery/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    ingestDiscoveryCandidates(payload = {}) {
      return request('/v1/admin/discovery/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchEvaluationStatus() {
      return request('/v1/admin/evaluation/status', undefined, true);
    },
    refreshEvaluationScores(payload = {}) {
      return request('/v1/admin/evaluation/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchContentStatus() {
      return request('/v1/admin/content/status', undefined, true);
    },
    refreshContent(payload = {}) {
      return request('/v1/admin/content/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchComparisonStatus() {
      return request('/v1/admin/comparison/status', undefined, true);
    },
    generateComparisonMatrix(payload = {}) {
      return request('/v1/admin/comparison/matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchMonitoringStatus() {
      return request('/v1/admin/monitoring/status', undefined, true);
    },
    runMonitoringProbe(payload = {}) {
      return request('/v1/admin/monitoring/probe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchMonitoringAlerts(limit = 50) {
      return request(`/v1/admin/monitoring/alerts${buildQuery({ limit })}`, undefined, true);
    },
    fetchToolComparison(toolSlugs = []) {
      const normalized = [...new Set((toolSlugs || []).map((slug) => String(slug || '').trim()).filter(Boolean))];
      if (normalized.length < 2) {
        throw new Error('Select at least two tools to compare.');
      }
      return request(`/v1/compare${buildQuery({ tools: normalized.join(',') })}`);
    },
    fetchToolReviews(toolSlug, limit = 20) {
      const slug = String(toolSlug || '').trim();
      if (!slug) {
        return Promise.resolve({ items: [] });
      }
      return request(`/v1/tools/${encodeURIComponent(slug)}/reviews${buildQuery({ limit })}`);
    },
    submitToolReview(toolSlug, payload = {}) {
      const slug = String(toolSlug || '').trim();
      if (!slug) {
        throw new Error('Tool slug is required.');
      }
      return request(`/v1/tools/${encodeURIComponent(slug)}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchTrendInsights(limit = 6) {
      return request(`/v1/trends/insights${buildQuery({ limit })}`, undefined, true);
    },
    fetchToolAnalytics(toolSlug) {
      const slug = String(toolSlug || '').trim();
      if (!slug) {
        throw new Error('Tool slug is required.');
      }
      return request(`/v1/analytics/tools/${encodeURIComponent(slug)}`, undefined, true);
    },
    submitToolListing(payload = {}) {
      return request('/v1/tools/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      }, true);
    },
    fetchRecommendationStack(payload = {}) {
      return request('/v1/recommend/stack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
      });
    },
    fetchPushCampaignHistoryCsvBlob(limit = 100) {
      return requestBlob(`/v1/admin/push/campaigns/export.csv${buildQuery({ limit })}`, undefined, true);
    },
    fetchPushPolicyHistoryCsvBlob(limit = 300, filters = {}) {
      const params = {
        limit,
        action: String(filters?.action || '').trim() || undefined,
        source: String(filters?.source || '').trim() || undefined,
        actor_user_id: String(filters?.actor_user_id || '').trim() || undefined,
      };
      return requestBlob(`/v1/admin/push/policy/history/export.csv${buildQuery(params)}`, undefined, true);
    },
    buildAdminEventsStreamUrl() {
      return buildAuthenticatedStreamUrl('/v1/admin/events/stream');
    },
    buildAgentRunProgressStreamUrl(runId) {
      const id = String(runId || '').trim();
      if (!id) {
        throw new Error('Run id is required.');
      }
      return buildAuthenticatedStreamUrl(`/v1/admin/agents/runs/${encodeURIComponent(id)}/stream`);
    },
    buildToolsFeedWebSocketUrl() {
      return buildWebSocketUrl('/v1/ws/tools/feed');
    },
  };
}