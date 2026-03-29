import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiArrowUpRight, FiShield } from 'react-icons/fi';
import {
  configurePushScheduler,
  fetchAdminEvents,
  fetchComparisonStatus,
  fetchContentStatus,
  fetchDiscoveryStatus,
  fetchEvaluationStatus,
  fetchAgentRuns,
  fetchMonitoringAlerts,
  fetchMonitoringStatus,
  fetchPipelineStatus,
  fetchPushCampaignStatus,
  fetchPushCampaignHistory,
  fetchPushPolicyHistory,
  fetchPushCampaignDetail,
  fetchPushDeliveryMetrics,
  downloadPushCampaignHistoryCsv,
  downloadPushPolicyHistoryCsv,
  generateComparisonMatrix,
  ingestDiscoveryCandidates,
  queuePushCampaign,
  refreshContent,
  refreshEvaluationScores,
  runMonitoringProbe,
  runPushSchedulerTick,
  updatePushAutoResumeLock,
  subscribeAdminEvents,
  subscribeAgentRunProgress,
  triggerDiscoveryRun,
  triggerAgentRun,
} from '../lib/apiClient';
import './AdminPage.css';

const AGENT_OPTIONS = [
  { value: 'discovery_agent', label: 'Discovery Agent' },
  { value: 'evaluation_agent', label: 'Evaluation Agent' },
  { value: 'content_agent', label: 'Content Agent' },
  { value: 'recommendation_agent', label: 'Recommendation Agent' },
  { value: 'monitoring_agent', label: 'Monitoring Agent' },
  { value: 'trend_agent', label: 'Trend Agent' },
  { value: 'comparison_agent', label: 'Comparison Agent' },
];

function getAdminErrorMessage(error, fallbackMessage) {
  const status = Number(error?.status || 0);
  if (status === 401) {
    return 'Your session is not authenticated for admin APIs. Please sign in again.';
  }
  if (status === 403) {
    return 'You are signed in, but your account is not authorized for admin access.';
  }
  return error?.message || fallbackMessage;
}

function rankAdminEventPriority(event) {
  const type = String(event?.type || '').toLowerCase();
  if (type.includes('alert') || type.includes('failed') || type.includes('critical')) return 0;
  if (type.includes('warning') || type.includes('degraded')) return 1;
  return 2;
}

function sortAdminEvents(events = []) {
  return [...events].sort((left, right) => {
    const rankDiff = rankAdminEventPriority(left) - rankAdminEventPriority(right);
    if (rankDiff !== 0) return rankDiff;
    const leftTime = Date.parse(left?.created_at || '') || 0;
    const rightTime = Date.parse(right?.created_at || '') || 0;
    return rightTime - leftTime;
  });
}

export default function AdminPage({ session }) {
  const [selectedAgent, setSelectedAgent] = useState('evaluation_agent');
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [pipelineError, setPipelineError] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [isAdminAccessDenied, setIsAdminAccessDenied] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState(null);
  const [isDiscoveryTriggering, setIsDiscoveryTriggering] = useState(false);
  const [ingestPayload, setIngestPayload] = useState('[\n  {\n    "name": "Example AI Tool",\n    "url": "https://example.com",\n    "description": "Useful AI tool discovered from source.",\n    "category": "Automation",\n    "pricing_model": "free"\n  }\n]');
  const [isIngesting, setIsIngesting] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState('');
  const [evaluationStatus, setEvaluationStatus] = useState(null);
  const [evaluationCount, setEvaluationCount] = useState(25);
  const [evaluationMessage, setEvaluationMessage] = useState('');
  const [isRefreshingEvaluation, setIsRefreshingEvaluation] = useState(false);
  const [contentStatus, setContentStatus] = useState(null);
  const [contentCount, setContentCount] = useState(20);
  const [contentMessage, setContentMessage] = useState('');
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [comparisonStatus, setComparisonStatus] = useState(null);
  const [comparisonInput, setComparisonInput] = useState('github-copilot,chatgpt,codeium');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonMessage, setComparisonMessage] = useState('');
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [monitoringCount, setMonitoringCount] = useState(30);
  const [monitoringAlerts, setMonitoringAlerts] = useState([]);
  const [monitoringMessage, setMonitoringMessage] = useState('');
  const [isMonitoringProbeRunning, setIsMonitoringProbeRunning] = useState(false);
  const [eventItems, setEventItems] = useState([]);
  const [eventError, setEventError] = useState('');
  const [pushCampaignStatus, setPushCampaignStatus] = useState(null);
  const [pushDeliveryMetrics, setPushDeliveryMetrics] = useState(null);
  const [pushTitle, setPushTitle] = useState('RecommenDex digest');
  const [pushBody, setPushBody] = useState('New recommendations are available in your dashboard.');
  const [pushTargetUserId, setPushTargetUserId] = useState('');
  const [pushLimit, setPushLimit] = useState(300);
  const [pushSchedulerEnabled, setPushSchedulerEnabled] = useState(false);
  const [pushSchedulerInterval, setPushSchedulerInterval] = useState(30);
  const [pushMessage, setPushMessage] = useState('');
  const [isQueueingPush, setIsQueueingPush] = useState(false);
  const [isSavingPushScheduler, setIsSavingPushScheduler] = useState(false);
  const [isRunningPushTick, setIsRunningPushTick] = useState(false);
  const [pushCampaignHistory, setPushCampaignHistory] = useState([]);
  const [pushPolicyHistory, setPushPolicyHistory] = useState([]);
  const [pushPolicyActionFilter, setPushPolicyActionFilter] = useState('');
  const [pushPolicySourceFilter, setPushPolicySourceFilter] = useState('');
  const [pushPolicyActorFilter, setPushPolicyActorFilter] = useState('');
  const [selectedPushCampaign, setSelectedPushCampaign] = useState(null);
  const [pushAutoResumeLockEnabled, setPushAutoResumeLockEnabled] = useState(true);
  const [confirmAutoResumeUnlock, setConfirmAutoResumeUnlock] = useState(false);
  const [isUpdatingAutoResumeLock, setIsUpdatingAutoResumeLock] = useState(false);

  const currentPushPolicyFilters = useMemo(() => ({
    action: String(pushPolicyActionFilter || '').trim() || undefined,
    source: String(pushPolicySourceFilter || '').trim() || undefined,
    actor_user_id: String(pushPolicyActorFilter || '').trim() || undefined,
  }), [pushPolicyActionFilter, pushPolicySourceFilter, pushPolicyActorFilter]);

  const pushSuccessRateSparkline = (() => {
    const values = (pushCampaignHistory || [])
      .slice(0, 12)
      .reverse()
      .map((entry) => {
        const targetCount = Number(entry?.target_count || 0);
        const deliveredCount = Number(entry?.delivered_count || 0);
        if (targetCount <= 0) return 0;
        return Math.max(0, Math.min(1, deliveredCount / targetCount));
      });

    if (values.length === 0) return '—';
    const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    return values.map((value) => blocks[Math.min(blocks.length - 1, Math.round(value * (blocks.length - 1)))]).join('');
  })();

  useEffect(() => {
    if (!session) return;

    let mounted = true;
    const loadPipeline = async () => {
      try {
        const [statusResponse, runsResponse, discoveryResponse, evaluationResponse, contentResponse, comparisonResponse, monitoringResponse, monitoringAlertsResponse, eventsResponse, pushStatusResponse, pushMetricsResponse, pushCampaignHistoryResponse, pushPolicyHistoryResponse] = await Promise.all([
          fetchPipelineStatus(),
          fetchAgentRuns(12),
          fetchDiscoveryStatus(),
          fetchEvaluationStatus(),
          fetchContentStatus(),
          fetchComparisonStatus(),
          fetchMonitoringStatus(),
          fetchMonitoringAlerts(25),
          fetchAdminEvents(25),
          fetchPushCampaignStatus(),
          fetchPushDeliveryMetrics(),
          fetchPushCampaignHistory(15),
          fetchPushPolicyHistory(20, currentPushPolicyFilters),
        ]);

        if (!mounted) return;

        setIsAdminAccessDenied(false);
        setPipelineStatus(statusResponse);
        setRecentRuns(runsResponse.items || []);
        setDiscoveryStatus(discoveryResponse);
        setEvaluationStatus(evaluationResponse);
        setContentStatus(contentResponse);
        setComparisonStatus(comparisonResponse);
        setMonitoringStatus(monitoringResponse);
        setMonitoringAlerts(monitoringAlertsResponse.items || []);
        setEventItems(sortAdminEvents(eventsResponse.items || []));
        setPushCampaignStatus(pushStatusResponse?.state || null);
        setPushAutoResumeLockEnabled(Boolean(pushStatusResponse?.state?.auto_resume_lock_enabled));
        setPushDeliveryMetrics(pushMetricsResponse?.metrics || null);
        setPushSchedulerEnabled(Boolean(pushStatusResponse?.state?.scheduler_enabled));
        setPushSchedulerInterval(Number(pushStatusResponse?.state?.interval_minutes || 30));
        setPushCampaignHistory(pushCampaignHistoryResponse?.items || []);
        setPushPolicyHistory(pushPolicyHistoryResponse?.items || []);
      } catch (error) {
        if (!mounted) return;
        const message = getAdminErrorMessage(error, 'Failed to load pipeline status.');
        setPipelineError(message);
        if (Number(error?.status || 0) === 403) {
          setIsAdminAccessDenied(true);
        }
      }
    };

    loadPipeline();
    const interval = setInterval(loadPipeline, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session, currentPushPolicyFilters]);

  useEffect(() => {
    if (!session) {
      setEventItems([]);
      setEventError('');
      return;
    }

    let closeStream = () => {};
    let disposed = false;

    const start = async () => {
      closeStream = await subscribeAdminEvents({
        onEvent: (event) => {
          setEventItems((prev) => {
            const next = [event, ...prev.filter((item) => item.id !== event.id)];
            return sortAdminEvents(next).slice(0, 50);
          });
          setEventError('');
        },
        onError: (error) => {
          setEventError(getAdminErrorMessage(error, 'Live admin event stream unavailable.'));
        },
      });

      if (disposed) {
        closeStream();
      }
    };

    start();

    return () => {
      disposed = true;
      closeStream();
    };
  }, [session]);

  useEffect(() => {
    if (!activeRun?.id) return;

    let closeStream = () => {};
    let disposed = false;

    const startStream = async () => {
      closeStream = await subscribeAgentRunProgress(activeRun.id, {
        onProgress: async (payload) => {
          const run = payload?.run;
          if (!run) return;

          setActiveRun(run);
          setRecentRuns((prev) => {
            const next = [run, ...prev.filter((item) => item.id !== run.id)];
            return next.slice(0, 12);
          });

          if (run.lifecycle_status === 'success' || run.lifecycle_status === 'failed') {
            try {
              const statusResponse = await fetchPipelineStatus();
              setPipelineStatus(statusResponse);
            } catch {
              return;
            }
          }
        },
        onError: (error) => {
          setPipelineError(getAdminErrorMessage(error, 'Live stream disconnected.'));
        },
      });

      if (disposed) {
        closeStream();
      }
    };

    startStream();

    const fallbackPoll = setInterval(async () => {
      try {
        const runsResponse = await fetchAgentRuns(12);
        const matched = (runsResponse.items || []).find((item) => item.id === activeRun.id);
        if (matched) {
          setActiveRun(matched);
          setRecentRuns(runsResponse.items || []);
        }
      } catch {
        return;
      }
    }, 3000);

    return () => {
      disposed = true;
      closeStream();
      clearInterval(fallbackPoll);
    };
  }, [activeRun?.id]);

  const handleTriggerAgent = async () => {
    setPipelineError('');
    setIsTriggering(true);

    try {
      const response = await triggerAgentRun({ agent_name: selectedAgent });
      if (response?.run) {
        setIsAdminAccessDenied(false);
        setActiveRun(response.run);
        setRecentRuns((prev) => [response.run, ...prev.filter((item) => item.id !== response.run.id)].slice(0, 12));
      }

      const statusResponse = await fetchPipelineStatus();
      setPipelineStatus(statusResponse);
    } catch (error) {
      setPipelineError(getAdminErrorMessage(error, 'Failed to trigger agent run.'));
      if (Number(error?.status || 0) === 403) {
        setIsAdminAccessDenied(true);
      }
    } finally {
      setIsTriggering(false);
    }
  };

  const handleTriggerDiscovery = async () => {
    setDiscoveryMessage('');
    setIsDiscoveryTriggering(true);
    try {
      const response = await triggerDiscoveryRun({});
      if (response?.run) {
        setActiveRun(response.run);
      }
      const statusResponse = await fetchDiscoveryStatus();
      setDiscoveryStatus(statusResponse);
      setDiscoveryMessage('Discovery run queued.');
    } catch (error) {
      setDiscoveryMessage(getAdminErrorMessage(error, 'Failed to trigger discovery run.'));
    } finally {
      setIsDiscoveryTriggering(false);
    }
  };

  const handleIngestDiscoveryBatch = async () => {
    setDiscoveryMessage('');
    setIsIngesting(true);
    try {
      const parsed = JSON.parse(ingestPayload);
      const response = await ingestDiscoveryCandidates({ items: parsed });
      setDiscoveryMessage(`Ingested ${response.submitted_count} items (${response.failed_count} failed).`);

      const [discoveryResponse, pipelineRuns] = await Promise.all([
        fetchDiscoveryStatus(),
        fetchAgentRuns(12),
      ]);

      setDiscoveryStatus(discoveryResponse);
      setRecentRuns(pipelineRuns.items || []);
    } catch (error) {
      setDiscoveryMessage(getAdminErrorMessage(error, 'Failed to ingest discovery batch.'));
    } finally {
      setIsIngesting(false);
    }
  };

  const handleRefreshEvaluation = async () => {
    setEvaluationMessage('');
    setIsRefreshingEvaluation(true);
    try {
      const response = await refreshEvaluationScores({ count: Number(evaluationCount) || 25 });
      setEvaluationMessage(`Refreshed ${response.updated_count} tool scores.`);
      const status = await fetchEvaluationStatus();
      setEvaluationStatus(status);
    } catch (error) {
      setEvaluationMessage(getAdminErrorMessage(error, 'Failed to refresh evaluation scores.'));
    } finally {
      setIsRefreshingEvaluation(false);
    }
  };

  const handleRefreshContent = async () => {
    setContentMessage('');
    setIsRefreshingContent(true);
    try {
      const response = await refreshContent({ count: Number(contentCount) || 20 });
      setContentMessage(`Refreshed ${response.updated_count} tool descriptions.`);
      const status = await fetchContentStatus();
      setContentStatus(status);
    } catch (error) {
      setContentMessage(getAdminErrorMessage(error, 'Failed to refresh content.'));
    } finally {
      setIsRefreshingContent(false);
    }
  };

  const handleGenerateComparison = async () => {
    setComparisonMessage('');
    setIsGeneratingComparison(true);
    try {
      const tools = comparisonInput
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      const response = await generateComparisonMatrix({ tools });
      setComparisonResult(response);
      setComparisonMessage(`Generated matrix for ${response?.matrix?.length || 0} tools.`);

      const status = await fetchComparisonStatus();
      setComparisonStatus(status);
    } catch (error) {
      setComparisonMessage(getAdminErrorMessage(error, 'Failed to generate comparison matrix.'));
    } finally {
      setIsGeneratingComparison(false);
    }
  };

  const handleRunMonitoringProbe = async () => {
    setMonitoringMessage('');
    setIsMonitoringProbeRunning(true);
    try {
      const response = await runMonitoringProbe({ count: Number(monitoringCount) || 30 });
      setMonitoringMessage(`Probe completed: ${response.probed_count} tools checked, ${response.generated_alert_count} alerts.`);

      const [statusResponse, alertsResponse] = await Promise.all([
        fetchMonitoringStatus(),
        fetchMonitoringAlerts(25),
      ]);

      setMonitoringStatus(statusResponse);
      setMonitoringAlerts(alertsResponse.items || []);
    } catch (error) {
      setMonitoringMessage(getAdminErrorMessage(error, 'Failed to run monitoring probe.'));
    } finally {
      setIsMonitoringProbeRunning(false);
    }
  };

  const handleQueuePushCampaign = async () => {
    setPushMessage('');
    setIsQueueingPush(true);
    try {
      const response = await queuePushCampaign({
        title: pushTitle,
        body: pushBody,
        target_user_id: pushTargetUserId || undefined,
        limit: Number(pushLimit) || 300,
      });
      setPushMessage(`Campaign ${response?.campaign_id || ''} queued (queue size ${response?.queue_size ?? 0}).`);
      const [statusResponse, metricsResponse] = await Promise.all([
        fetchPushCampaignStatus(),
        fetchPushDeliveryMetrics(),
      ]);
      setPushCampaignStatus(statusResponse?.state || null);
      setPushDeliveryMetrics(metricsResponse?.metrics || null);
      const [historyResponse, policyHistoryResponse] = await Promise.all([
        fetchPushCampaignHistory(15),
        fetchPushPolicyHistory(20, currentPushPolicyFilters),
      ]);
      setPushCampaignHistory(historyResponse?.items || []);
      setPushPolicyHistory(policyHistoryResponse?.items || []);
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to queue push campaign.'));
    } finally {
      setIsQueueingPush(false);
    }
  };

  const handleSavePushScheduler = async () => {
    setPushMessage('');
    setIsSavingPushScheduler(true);
    try {
      const response = await configurePushScheduler({
        enabled: pushSchedulerEnabled,
        interval_minutes: Number(pushSchedulerInterval) || 30,
      });
      setPushCampaignStatus(response?.state || null);
      const policyHistoryResponse = await fetchPushPolicyHistory(20, currentPushPolicyFilters);
      setPushPolicyHistory(policyHistoryResponse?.items || []);
      setPushMessage('Push scheduler updated.');
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to update push scheduler.'));
    } finally {
      setIsSavingPushScheduler(false);
    }
  };

  const handleRunPushSchedulerTick = async () => {
    setPushMessage('');
    setIsRunningPushTick(true);
    try {
      const response = await runPushSchedulerTick({
        force: true,
        title: pushTitle,
        body: pushBody,
        limit: Number(pushLimit) || 300,
      });
      setPushCampaignStatus(response?.state?.state || response?.state || null);
      setPushMessage(response?.queued ? 'Scheduler tick queued a campaign.' : response?.message || 'Scheduler tick completed.');
      const metricsResponse = await fetchPushDeliveryMetrics();
      setPushDeliveryMetrics(metricsResponse?.metrics || null);
      const [historyResponse, policyHistoryResponse] = await Promise.all([
        fetchPushCampaignHistory(15),
        fetchPushPolicyHistory(20, currentPushPolicyFilters),
      ]);
      setPushCampaignHistory(historyResponse?.items || []);
      setPushPolicyHistory(policyHistoryResponse?.items || []);
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to run push scheduler tick.'));
    } finally {
      setIsRunningPushTick(false);
    }
  };

  const handleSelectPushCampaign = async (campaignId) => {
    if (!campaignId) return;
    setPushMessage('');
    try {
      const response = await fetchPushCampaignDetail(campaignId);
      setSelectedPushCampaign(response?.campaign || null);
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to load campaign detail.'));
      setSelectedPushCampaign(null);
    }
  };

  const handleExportPushCampaignCsv = async () => {
    setPushMessage('');
    try {
      await downloadPushCampaignHistoryCsv(200);
      setPushMessage('Push campaign history CSV exported.');
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to export push campaign history CSV.'));
    }
  };

  const handleExportPushPolicyCsv = async () => {
    setPushMessage('');
    try {
      await downloadPushPolicyHistoryCsv(300, currentPushPolicyFilters);
      setPushMessage('Push policy history CSV exported.');
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to export push policy history CSV.'));
    }
  };

  const handleRefreshPushPolicyHistory = async () => {
    setPushMessage('');
    try {
      const policyHistoryResponse = await fetchPushPolicyHistory(20, currentPushPolicyFilters);
      setPushPolicyHistory(policyHistoryResponse?.items || []);
      setPushMessage('Push policy history refreshed.');
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to refresh push policy history.'));
    }
  };

  const handleClearPushPolicyFilters = () => {
    setPushPolicyActionFilter('');
    setPushPolicySourceFilter('');
    setPushPolicyActorFilter('');
  };

  const handleUpdateAutoResumeLock = async () => {
    setPushMessage('');
    setIsUpdatingAutoResumeLock(true);
    try {
      const response = await updatePushAutoResumeLock({
        locked: pushAutoResumeLockEnabled,
        confirm_unlock: confirmAutoResumeUnlock,
      });
      setPushCampaignStatus(response?.state || null);
      setPushAutoResumeLockEnabled(Boolean(response?.state?.auto_resume_lock_enabled));
      setConfirmAutoResumeUnlock(false);
      const policyHistoryResponse = await fetchPushPolicyHistory(20, currentPushPolicyFilters);
      setPushPolicyHistory(policyHistoryResponse?.items || []);
      setPushMessage('Auto-resume governance lock updated.');
    } catch (error) {
      setPushMessage(getAdminErrorMessage(error, 'Failed to update auto-resume lock.'));
    } finally {
      setIsUpdatingAutoResumeLock(false);
    }
  };

  if (!session) {
    return (
      <section className="admin-page">
        <div className="admin-locked">
          <FiShield size={48} />
          <h1 className="display">Access Required</h1>
          <p>Sign in to access the orchestration admin panel.</p>
          <Link to="/auth" className="admin-btn-primary">
            Sign In <FiArrowUpRight />
          </Link>
        </div>
      </section>
    );
  }

  if (isAdminAccessDenied) {
    return (
      <section className="admin-page">
        <div className="admin-locked">
          <FiShield size={48} />
          <h1 className="display">Admin Access Restricted</h1>
          <p>You are signed in, but your account is not authorized for admin operations.</p>
          <p className="admin-panel-error mono">{pipelineError || 'Contact your administrator to request access.'}</p>
          <Link to="/dashboard" className="admin-btn-primary">
            Back to Dashboard <FiArrowUpRight />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-inner">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow mono">ADMIN</p>
            <h1 className="display">Agent Pipeline Control</h1>
            <p className="admin-subtitle">Trigger and monitor orchestration jobs in real time.</p>
          </div>
          <Link to="/dashboard" className="admin-btn-ghost">Back to Dashboard</Link>
        </header>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display"><FiActivity /> Live Pipeline Monitor</h2>
            <div className="admin-panel-controls">
              <select
                className="admin-select"
                value={selectedAgent}
                onChange={(event) => setSelectedAgent(event.target.value)}
              >
                {AGENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button type="button" className="admin-btn-primary" onClick={handleTriggerAgent} disabled={isTriggering}>
                {isTriggering ? 'Starting…' : 'Run Agent'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Queue: {pipelineStatus?.queue_length ?? 0}</span>
            <span>Running: {pipelineStatus?.running_count ?? 0}</span>
            <span>Recent Success: {pipelineStatus?.recent_success_count ?? 0}</span>
            <span>Recent Failed: {pipelineStatus?.recent_failed_count ?? 0}</span>
          </div>

          {activeRun && (
            <div className="admin-active-run">
              <p className="mono">Active run: {activeRun.id}</p>
              <p>
                {activeRun.agent_name} · {activeRun.lifecycle_status || activeRun.status} · {activeRun.progress_percent ?? 0}%
              </p>
              <div
                className="admin-progress-track"
                role="progressbar"
                aria-valuenow={activeRun.progress_percent ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="admin-progress-bar" style={{ width: `${activeRun.progress_percent ?? 0}%` }} />
              </div>
            </div>
          )}

          {pipelineError && <p className="admin-panel-error mono">{pipelineError}</p>}

          <ul className="admin-runs-list">
            {recentRuns.map((run) => (
              <li key={run.id} className="admin-run-item mono">
                <span>{run.agent_name}</span>
                <span>{run.lifecycle_status || run.status}</span>
                <span>{run.progress_percent ?? (run.status === 'success' ? 100 : 0)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Discovery Pipeline</h2>
            <div className="admin-panel-controls">
              <button type="button" className="admin-btn-primary" onClick={handleTriggerDiscovery} disabled={isDiscoveryTriggering}>
                {isDiscoveryTriggering ? 'Queueing…' : 'Trigger Discovery'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Scheduler: {discoveryStatus?.state?.scheduler_enabled ? 'On' : 'Off'}</span>
            <span>Interval: {discoveryStatus?.state?.interval_minutes ?? 0}m</span>
            <span>Last ingest: {discoveryStatus?.state?.last_ingest_at ? new Date(discoveryStatus.state.last_ingest_at).toLocaleString() : '—'}</span>
            <span>Total ingested: {discoveryStatus?.state?.total_ingested_count ?? 0}</span>
          </div>

          <label className="admin-textarea-label mono">
            Discovery candidate JSON array
            <textarea
              className="admin-textarea"
              rows={10}
              value={ingestPayload}
              onChange={(event) => setIngestPayload(event.target.value)}
            />
          </label>

          <button type="button" className="admin-btn-primary" onClick={handleIngestDiscoveryBatch} disabled={isIngesting}>
            {isIngesting ? 'Ingesting…' : 'Ingest Discovery Batch'} <FiArrowUpRight />
          </button>

          {discoveryMessage && <p className="admin-panel-error mono">{discoveryMessage}</p>}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Evaluation Refresh</h2>
            <div className="admin-panel-controls">
              <input
                type="number"
                className="admin-select"
                min={1}
                max={100}
                value={evaluationCount}
                onChange={(event) => setEvaluationCount(Number(event.target.value))}
              />
              <button type="button" className="admin-btn-primary" onClick={handleRefreshEvaluation} disabled={isRefreshingEvaluation}>
                {isRefreshingEvaluation ? 'Refreshing…' : 'Refresh Scores'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Last refresh: {evaluationStatus?.state?.last_refresh_at ? new Date(evaluationStatus.state.last_refresh_at).toLocaleString() : '—'}</span>
            <span>Last batch: {evaluationStatus?.state?.last_batch_size ?? 0}</span>
            <span>Total refreshed: {evaluationStatus?.state?.total_refreshed_count ?? 0}</span>
            <span>Mode: Score recalibration</span>
          </div>

          {evaluationMessage && <p className="admin-panel-error mono">{evaluationMessage}</p>}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Content Refresh</h2>
            <div className="admin-panel-controls">
              <input
                type="number"
                className="admin-select"
                min={1}
                max={100}
                value={contentCount}
                onChange={(event) => setContentCount(Number(event.target.value))}
              />
              <button type="button" className="admin-btn-primary" onClick={handleRefreshContent} disabled={isRefreshingContent}>
                {isRefreshingContent ? 'Refreshing…' : 'Refresh Content'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Last refresh: {contentStatus?.state?.last_refresh_at ? new Date(contentStatus.state.last_refresh_at).toLocaleString() : '—'}</span>
            <span>Last batch: {contentStatus?.state?.last_batch_size ?? 0}</span>
            <span>Total refreshed: {contentStatus?.state?.total_refreshed_count ?? 0}</span>
            <span>Mode: Description update</span>
          </div>

          {contentMessage && <p className="admin-panel-error mono">{contentMessage}</p>}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Comparison Matrix</h2>
            <div className="admin-panel-controls">
              <button type="button" className="admin-btn-primary" onClick={handleGenerateComparison} disabled={isGeneratingComparison}>
                {isGeneratingComparison ? 'Generating…' : 'Generate Matrix'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Last generated: {comparisonStatus?.state?.last_generated_at ? new Date(comparisonStatus.state.last_generated_at).toLocaleString() : '—'}</span>
            <span>Last matrix size: {comparisonStatus?.state?.last_matrix_size ?? 0}</span>
            <span>Total generated: {comparisonStatus?.state?.total_generated_count ?? 0}</span>
            <span>Mode: Batch compare</span>
          </div>

          <label className="admin-textarea-label mono">
            Tool slugs (comma-separated)
            <textarea
              className="admin-textarea"
              rows={3}
              value={comparisonInput}
              onChange={(event) => setComparisonInput(event.target.value)}
            />
          </label>

          {comparisonResult?.winners && (
            <div className="admin-panel-stats mono">
              <span>Best score: {comparisonResult.winners.best_score || '—'}</span>
              <span>Best value: {comparisonResult.winners.best_value || '—'}</span>
              <span>Best rating: {comparisonResult.winners.best_rating || '—'}</span>
              <span>Rows: {comparisonResult.matrix?.length || 0}</span>
            </div>
          )}

          {comparisonResult?.matrix?.length > 0 && (
            <ul className="admin-runs-list">
              {comparisonResult.matrix.map((row) => (
                <li key={row.id} className="admin-run-item mono">
                  <span>{row.name}</span>
                  <span>{row.category}</span>
                  <span>{row.score}</span>
                </li>
              ))}
            </ul>
          )}

          {comparisonMessage && <p className="admin-panel-error mono">{comparisonMessage}</p>}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Monitoring Agent</h2>
            <div className="admin-panel-controls">
              <input
                type="number"
                className="admin-select"
                min={1}
                max={200}
                value={monitoringCount}
                onChange={(event) => setMonitoringCount(Number(event.target.value))}
              />
              <button type="button" className="admin-btn-primary" onClick={handleRunMonitoringProbe} disabled={isMonitoringProbeRunning}>
                {isMonitoringProbeRunning ? 'Probing…' : 'Run Probe'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Last probe: {monitoringStatus?.state?.last_probe_at ? new Date(monitoringStatus.state.last_probe_at).toLocaleString() : '—'}</span>
            <span>Last batch: {monitoringStatus?.state?.last_batch_size ?? 0}</span>
            <span>Healthy: {monitoringStatus?.state?.last_healthy_count ?? 0}</span>
            <span>Degraded: {monitoringStatus?.state?.last_degraded_count ?? 0}</span>
            <span>Down: {monitoringStatus?.state?.last_down_count ?? 0}</span>
            <span>Pricing changes: {monitoringStatus?.state?.last_pricing_change_count ?? 0}</span>
            <span>Deprecated flags: {monitoringStatus?.state?.last_deprecated_count ?? 0}</span>
          </div>

          {monitoringAlerts.length > 0 && (
            <ul className="admin-runs-list">
              {monitoringAlerts.slice(0, 10).map((alert) => (
                <li key={alert.id} className="admin-run-item mono">
                  <span>{alert.type}</span>
                  <span>{alert.tool_name || 'Unknown tool'}</span>
                  <span>{alert.severity}</span>
                </li>
              ))}
            </ul>
          )}

          {monitoringAlerts.length === 0 && <p className="mono">No monitoring alerts yet.</p>}
          {monitoringMessage && <p className="admin-panel-error mono">{monitoringMessage}</p>}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Push Campaigns</h2>
            <div className="admin-panel-controls">
              <button type="button" className="admin-btn-ghost" onClick={handleExportPushCampaignCsv}>
                Export CSV
              </button>
              <button type="button" className="admin-btn-ghost" onClick={handleExportPushPolicyCsv}>
                Export Policy CSV
              </button>
              <button type="button" className="admin-btn-primary" onClick={handleQueuePushCampaign} disabled={isQueueingPush}>
                {isQueueingPush ? 'Queueing…' : 'Queue Campaign'} <FiArrowUpRight />
              </button>
            </div>
          </div>

          <div className="admin-panel-stats mono">
            <span>Worker: {pushCampaignStatus?.worker_running ? 'Running' : 'Stopped'}</span>
            <span>Queue size: {pushCampaignStatus?.queue_size ?? 0}</span>
            <span>Scheduler: {pushCampaignStatus?.scheduler_enabled ? 'On' : 'Off'}</span>
            <span>Interval: {pushCampaignStatus?.interval_minutes ?? 0}m</span>
            <span>Status: {pushCampaignStatus?.last_status || 'idle'}</span>
            <span>Auto-paused: {pushCampaignStatus?.auto_paused_by_policy ? 'Yes' : 'No'}</span>
            <span>Low-success streak: {pushCampaignStatus?.low_success_streak ?? 0}</span>
            <span>Auto-resume: {pushCampaignStatus?.auto_resume_enabled ? 'On' : 'Off'}</span>
            <span>Auto-resume lock: {pushCampaignStatus?.auto_resume_lock_enabled ? 'Locked' : 'Unlocked'}</span>
            <span>Resume checks: {pushCampaignStatus?.resume_recommendation_streak ?? 0}/{pushCampaignStatus?.auto_resume_required_checks ?? 0}</span>
            <span>Resume recommended: {pushCampaignStatus?.resume_recommended ? 'Yes' : 'No'}</span>
            <span>Resume avg success: {pushCampaignStatus?.resume_average_success_rate ?? '—'}</span>
            <span>Last campaign: {pushCampaignStatus?.last_campaign_id ? String(pushCampaignStatus.last_campaign_id).slice(0, 8) : '—'}</span>
            <span>Delivery mode: {pushDeliveryMetrics?.delivery_mode || 'simulation'}</span>
            <span>Delivery ready: {pushDeliveryMetrics?.delivery_ready ? 'Yes' : 'No'}</span>
            <span>Total enqueued: {pushDeliveryMetrics?.total_enqueued ?? 0}</span>
            <span>Total delivered: {pushDeliveryMetrics?.total_delivered ?? 0}</span>
            <span>Total failed: {pushDeliveryMetrics?.total_failed ?? 0}</span>
            <span>Stale pruned: {pushDeliveryMetrics?.total_stale_pruned ?? 0}</span>
            <span>Success trend: {pushSuccessRateSparkline}</span>
          </div>

          {pushCampaignStatus?.auto_paused_by_policy && pushCampaignStatus?.policy_pause_reason && (
            <p className="admin-panel-error mono">{pushCampaignStatus.policy_pause_reason}</p>
          )}

          {pushCampaignStatus?.auto_paused_by_policy && pushCampaignStatus?.resume_recommendation_reason && (
            <p className="mono">{pushCampaignStatus.resume_recommendation_reason}</p>
          )}

          <label className="admin-textarea-label mono">
            Campaign title
            <input
              type="text"
              className="admin-select"
              value={pushTitle}
              onChange={(event) => setPushTitle(event.target.value)}
            />
          </label>

          <label className="admin-textarea-label mono">
            Campaign body
            <textarea
              className="admin-textarea"
              rows={3}
              value={pushBody}
              onChange={(event) => setPushBody(event.target.value)}
            />
          </label>

          <div className="admin-panel-controls">
            <input
              type="text"
              className="admin-select"
              value={pushTargetUserId}
              onChange={(event) => setPushTargetUserId(event.target.value)}
              placeholder="Target user id (optional)"
            />
            <input
              type="number"
              className="admin-select"
              min={1}
              max={1000}
              value={pushLimit}
              onChange={(event) => setPushLimit(Number(event.target.value))}
            />
          </div>

          <div className="admin-panel-controls">
            <label className="admin-textarea-label mono">
              <span>Auto-resume lock enabled</span>
              <input
                type="checkbox"
                checked={pushAutoResumeLockEnabled}
                onChange={(event) => setPushAutoResumeLockEnabled(event.target.checked)}
              />
            </label>
            {!pushAutoResumeLockEnabled && (
              <label className="admin-textarea-label mono">
                <span>Confirm unlock</span>
                <input
                  type="checkbox"
                  checked={confirmAutoResumeUnlock}
                  onChange={(event) => setConfirmAutoResumeUnlock(event.target.checked)}
                />
              </label>
            )}
            <button type="button" className="admin-btn-primary" onClick={handleUpdateAutoResumeLock} disabled={isUpdatingAutoResumeLock}>
              {isUpdatingAutoResumeLock ? 'Updating…' : 'Update Lock'} <FiArrowUpRight />
            </button>
          </div>

          <div className="admin-panel-controls">
            <label className="admin-textarea-label mono">
              <span>Scheduler enabled</span>
              <input
                type="checkbox"
                checked={pushSchedulerEnabled}
                onChange={(event) => setPushSchedulerEnabled(event.target.checked)}
              />
            </label>
            <input
              type="number"
              className="admin-select"
              min={1}
              max={1440}
              value={pushSchedulerInterval}
              onChange={(event) => setPushSchedulerInterval(Number(event.target.value))}
            />
            <button type="button" className="admin-btn-primary" onClick={handleSavePushScheduler} disabled={isSavingPushScheduler}>
              {isSavingPushScheduler ? 'Saving…' : 'Save Scheduler'} <FiArrowUpRight />
            </button>
            <button type="button" className="admin-btn-primary" onClick={handleRunPushSchedulerTick} disabled={isRunningPushTick}>
              {isRunningPushTick ? 'Running…' : 'Run Tick Now'} <FiArrowUpRight />
            </button>
          </div>

          {pushMessage && <p className="admin-panel-error mono">{pushMessage}</p>}

          {pushCampaignHistory.length > 0 && (
            <ul className="admin-runs-list">
              {pushCampaignHistory.map((entry) => (
                <li key={entry.campaign_id} className="admin-run-item mono">
                  <span>{String(entry.campaign_id || '').slice(0, 8)}</span>
                  <span>{entry.status || 'queued'}</span>
                  <span>{entry.delivered_count ?? 0}/{entry.target_count ?? 0}</span>
                  <button type="button" className="admin-btn-ghost" onClick={() => handleSelectPushCampaign(entry.campaign_id)}>
                    Inspect
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedPushCampaign && (
            <div className="admin-active-run">
              <p className="mono">Campaign: {selectedPushCampaign.campaign_id}</p>
              <p>
                {selectedPushCampaign.status} · mode {selectedPushCampaign.delivery_mode || 'simulation'} · delivered {selectedPushCampaign.delivered_count ?? 0}/{selectedPushCampaign.target_count ?? 0}
              </p>
              <p className="mono">Queued: {selectedPushCampaign.queued_at || '—'} · Completed: {selectedPushCampaign.completed_at || '—'}</p>
            </div>
          )}

          <h3 className="display admin-subpanel-title">Policy History</h3>
          <div className="admin-panel-controls">
            <select
              className="admin-select"
              value={pushPolicyActionFilter}
              onChange={(event) => setPushPolicyActionFilter(event.target.value)}
            >
              <option value="">All actions</option>
              <option value="scheduler.updated">scheduler.updated</option>
              <option value="auto_resume_lock.updated">auto_resume_lock.updated</option>
              <option value="scheduler.auto_paused">scheduler.auto_paused</option>
              <option value="scheduler.auto_resumed">scheduler.auto_resumed</option>
            </select>
            <select
              className="admin-select"
              value={pushPolicySourceFilter}
              onChange={(event) => setPushPolicySourceFilter(event.target.value)}
            >
              <option value="">All sources</option>
              <option value="admin_api">admin_api</option>
              <option value="policy">policy</option>
              <option value="system">system</option>
            </select>
            <input
              type="text"
              className="admin-select"
              value={pushPolicyActorFilter}
              onChange={(event) => setPushPolicyActorFilter(event.target.value)}
              placeholder="Actor user id"
            />
            <button type="button" className="admin-btn-ghost" onClick={handleRefreshPushPolicyHistory}>
              Apply
            </button>
            <button type="button" className="admin-btn-ghost" onClick={handleClearPushPolicyFilters}>
              Clear
            </button>
          </div>
          <ul className="admin-events-list">
            {pushPolicyHistory.length === 0 && <li className="mono">No policy history matches current filters.</li>}
            {pushPolicyHistory.map((entry) => (
              <li key={entry.id} className="admin-event-item">
                <div className="admin-event-top mono">
                  <span>{entry.action || 'policy.updated'}</span>
                  <span>{entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}</span>
                </div>
                <p className="mono">actor: {entry.actor_user_id || 'system'} · source: {entry.source || 'system'}</p>
                {entry.reason && <p>{entry.reason}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="display">Live Events</h2>
            <span className="mono">{eventItems.length} events</span>
          </div>

          {eventError && <p className="admin-panel-error mono">{eventError}</p>}

          <ul className="admin-events-list">
            {eventItems.length === 0 && <li className="mono">No events yet.</li>}
            {eventItems.map((event) => (
              <li
                key={event.id}
                className={`admin-event-item ${rankAdminEventPriority(event) === 0 ? 'admin-event-item--priority' : ''}`}
              >
                <div className="admin-event-top mono">
                  <span>{event.type}</span>
                  <span>{event.created_at ? new Date(event.created_at).toLocaleTimeString() : '—'}</span>
                </div>
                <p>{event.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
