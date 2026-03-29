import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiCompass, FiGrid, FiZap, FiShield, FiLogOut, FiBookmark, FiClock, FiTrash2, FiGitBranch, FiBell, FiTrendingUp, FiDollarSign, FiActivity } from 'react-icons/fi';
import { supabase, getSavedTools, unsaveTool, getSearchHistory, logSearch } from '../lib/supabaseClient';
import {
  fetchNotifications,
  fetchNotificationSubscriptions,
  fetchPersonalizedFeed,
  fetchProfilePreferences,
  fetchTrendInsights,
  triggerNotificationTest,
  updateProfilePreferences,
  upsertNotificationSubscription,
} from '../lib/apiClient';
import { loadAiToolsModule } from '../shared/aiToolsLoader';
import { startContinuousAudit, getLatestAuditSnapshot, getSyncHealthStatus } from '../lib/agentPerformanceService';
import ToolCard from '../components/ToolCard';
import './DashboardPage.css';

let notificationServicePromise;
function loadNotificationService() {
  if (!notificationServicePromise) {
    notificationServicePromise = import('../lib/notificationService');
  }
  return notificationServicePromise;
}

export default function DashboardPage({ session }) {
  const [requirement, setRequirement] = useState('');
  const [submittedReq, setSubmittedReq] = useState('');
  const [budgetMode, setBudgetMode] = useState('mixed');
  const [savedToolIds, setSavedToolIds] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [notificationItems, setNotificationItems] = useState([]);
  const [feedError, setFeedError] = useState('');
  const [trendInsights, setTrendInsights] = useState(null);
  const [profilePreferences, setProfilePreferences] = useState({
    preferred_categories: [],
    budget_mode: 'mixed',
    skill_level: 'intermediate',
    notifications_enabled: true,
    opt_in_personalization: true,
  });
  const [preferredCategoriesInput, setPreferredCategoriesInput] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('unsupported');
  const [pushStatus, setPushStatus] = useState('');
  const [pushSubscriptionCount, setPushSubscriptionCount] = useState(0);
  const [aiToolsModule, setAiToolsModule] = useState(null);
  const [agentAuditSnapshot, setAgentAuditSnapshot] = useState(null);
  const [agentAuditStatus, setAgentAuditStatus] = useState('Agent monitor initializing...');
  const [syncHealth, setSyncHealth] = useState(() => getSyncHealthStatus());

  const userId = session?.user?.id;

  const refreshPersonalizedPanels = async (count = 6) => {
    const [feedResponse, notificationResponse] = await Promise.all([
      fetchPersonalizedFeed(count),
      fetchNotifications(count),
    ]);

    return {
      feedItems: feedResponse?.items || [],
      notificationItems: notificationResponse?.items || [],
    };
  };

  // Load saved tools & search history from Supabase
  useEffect(() => {
    if (!userId) return;
    getSavedTools(userId).then(setSavedToolIds).catch(console.error);
    getSearchHistory(userId, 10).then(setSearchHistory).catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!session) {
      setAiToolsModule(null);
      return;
    }

    let ignore = false;

    loadAiToolsModule()
      .then((module) => {
        if (!ignore) {
          setAiToolsModule(module);
        }
      })
      .catch(() => {
        if (!ignore) {
          setAiToolsModule(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session]);

  useEffect(() => {
    if (!userId) {
      setFeedItems([]);
      setNotificationItems([]);
      setFeedError('');
      setTrendInsights(null);
      return;
    }

    let ignore = false;
    Promise.all([
      refreshPersonalizedPanels(6),
      fetchTrendInsights(5),
      fetchProfilePreferences(),
      fetchNotificationSubscriptions(),
    ])
      .then(([panels, trendResponse, profileResponse, subscriptionsResponse]) => {
        if (ignore) return;
        setFeedItems(panels.feedItems);
        setNotificationItems(panels.notificationItems);
        setTrendInsights(trendResponse || null);
        setPushSubscriptionCount(Number(subscriptionsResponse?.count || 0));
        const preferences = profileResponse?.preferences || {};
        setProfilePreferences((prev) => ({ ...prev, ...preferences }));
        setPreferredCategoriesInput((preferences.preferred_categories || []).join(', '));
        setFeedError('');
      })
      .catch(() => {
        if (ignore) return;
        setFeedItems([]);
        setNotificationItems([]);
        setTrendInsights(null);
        setPushSubscriptionCount(0);
        setFeedError('Personalized feed is unavailable right now.');
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  useEffect(() => {
    let ignore = false;

    loadNotificationService()
      .then((module) => {
        if (!ignore) {
          setNotificationPermission(module.getNotificationPermission());
        }
      })
      .catch(() => {
        if (!ignore) {
          setNotificationPermission('unsupported');
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSaveProfilePreferences = async () => {
    setProfileStatus('');
    setIsSavingProfile(true);
    try {
      const nextPayload = {
        ...profilePreferences,
        preferred_categories: preferredCategoriesInput
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await updateProfilePreferences(nextPayload);
      const nextPreferences = response?.preferences || nextPayload;
      setProfilePreferences((prev) => ({ ...prev, ...nextPreferences }));
      setPreferredCategoriesInput((nextPreferences.preferred_categories || []).join(', '));
      setProfileStatus('Preferences saved. Refreshing personalized feed...');

      const panels = await refreshPersonalizedPanels(6);
      setFeedItems(panels.feedItems);
      setNotificationItems(panels.notificationItems);
      setProfileStatus('Preferences saved.');
    } catch (error) {
      setProfileStatus(error?.message || 'Unable to save preferences right now.');
    } finally {
      setIsSavingProfile(false);
    }
  };


  const catalogTools = useMemo(() => aiToolsModule?.aiTools || [], [aiToolsModule]);
  const catalogCategories = useMemo(() => aiToolsModule?.categories || [], [aiToolsModule]);
  const recommendToolsFn = aiToolsModule?.recommendTools;
  const recommendWorkflowFn = aiToolsModule?.recommendWorkflow;
  const getTopToolsFn = aiToolsModule?.getTopTools;

  useEffect(() => {
    const cached = getLatestAuditSnapshot();
    if (cached) {
      setAgentAuditSnapshot(cached);
      setAgentAuditStatus(`Loaded last audit: ${new Date(cached.updatedAt).toLocaleTimeString()}`);
      setSyncHealth(cached.summary?.sync || getSyncHealthStatus());
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSyncHealth(getSyncHealthStatus());
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!session || catalogTools.length === 0) return undefined;

    setAgentAuditStatus('Agent monitor running continuous audits...');
    const stopAudit = startContinuousAudit(catalogTools, (snapshot) => {
      setAgentAuditSnapshot(snapshot);
      setAgentAuditStatus(`Updated at ${new Date(snapshot.updatedAt).toLocaleTimeString()} · Auto-refresh every 2 min`);
      setSyncHealth(snapshot.summary?.sync || getSyncHealthStatus());
    }, 120000);

    return () => {
      stopAudit?.();
    };
  }, [session, catalogTools]);

  const agentScoresById = useMemo(() => {
    const map = new Map();
    (agentAuditSnapshot?.scores || []).forEach((entry) => {
      map.set(entry.id, Number(entry.agentScore || 0));
    });
    return map;
  }, [agentAuditSnapshot]);

  const savedTools = useMemo(() => {
    const ids = savedToolIds.map((s) => s.tool_id);
    return catalogTools.filter((t) => ids.includes(t.id));
  }, [savedToolIds, catalogTools]);

  const recommendations = useMemo(() => {
    if (!submittedReq) return catalogTools.slice(0, 4);
    if (!recommendToolsFn) return catalogTools.slice(0, 4);
    const baseRecommendations = recommendToolsFn(submittedReq, 'All', 4, { budgetMode });
    return [...baseRecommendations].sort((left, right) => {
      const leftScore = agentScoresById.get(left.id) || 0;
      const rightScore = agentScoresById.get(right.id) || 0;
      return rightScore - leftScore;
    });
  }, [submittedReq, budgetMode, catalogTools, recommendToolsFn, agentScoresById]);

  const workflow = useMemo(() => {
    if (!submittedReq) return null;
    if (!recommendWorkflowFn) return null;
    return recommendWorkflowFn(submittedReq, 'All', { budgetMode });
  }, [submittedReq, budgetMode, recommendWorkflowFn]);

  const topTools = useMemo(() => {
    if (!getTopToolsFn) return [];
    const baseline = getTopToolsFn(6);
    return [...baseline]
      .sort((left, right) => (agentScoresById.get(right.id) || right.score || 0) - (agentScoresById.get(left.id) || left.score || 0))
      .slice(0, 3);
  }, [getTopToolsFn, agentScoresById]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSubmittedReq(requirement);
    if (userId && requirement.trim()) {
      await logSearch(userId, requirement.trim(), 'All').catch(console.error);
      getSearchHistory(userId, 10).then(setSearchHistory).catch(console.error);
    }
  };

  const handleRemoveSaved = async (toolId) => {
    if (!userId) return;
    await unsaveTool(userId, toolId);
    setSavedToolIds((prev) => prev.filter((s) => s.tool_id !== toolId));
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleEnableNotifications = async () => {
    setPushStatus('');
    try {
      const notificationService = await loadNotificationService();
      const permission = await notificationService.requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const subscriptionPayload = await notificationService.ensurePushSubscription();
        await upsertNotificationSubscription(subscriptionPayload);
        const subscriptionsResponse = await fetchNotificationSubscriptions();
        setPushSubscriptionCount(Number(subscriptionsResponse?.count || 0));
        setProfilePreferences((prev) => ({ ...prev, notifications_enabled: true }));
        setPushStatus('Notifications enabled and synced to backend subscription store.');
      } else if (permission === 'denied') {
        setPushStatus('Notifications are blocked. Update browser site settings to enable.');
      } else {
        setPushStatus('Notification permission dismissed.');
      }
    } catch (error) {
      setPushStatus(error?.message || 'Unable to request notification permission.');
    }
  };

  const handleTestNotification = async () => {
    setPushStatus('');
    try {
      const notificationService = await loadNotificationService();
      const firstItem = notificationItems[0];
      await notificationService.showLocalNotification({
        title: firstItem?.title || 'RecommenDex update',
        body: firstItem?.message || 'Push notification groundwork is active.',
        tag: 'recommendex-dashboard-test',
      });
      const backendResult = await triggerNotificationTest({
        title: firstItem?.title || 'RecommenDex update',
        body: firstItem?.message || 'Backend test push queued.',
      });
      const queuedCount = Number(backendResult?.queued_count || 0);
      const deliveredCount = Number(backendResult?.delivered_count || 0);
      const failedCount = Number(backendResult?.failed_count || 0);
      const deliveryMode = String(backendResult?.delivery_mode || 'simulation');
      setPushStatus(
        `Test notification sent locally. Backend(${deliveryMode}) delivered ${deliveredCount}, queued ${queuedCount}, failed ${failedCount}.`,
      );
    } catch (error) {
      setPushStatus(error?.message || 'Unable to send test notification.');
    }
  };

  if (!session) {
    return (
      <section className="dashboard-page-neo">
        <div className="dashboard-locked-neo">
          <FiShield size={48} />
          <h1 className="display">Access Required</h1>
          <p>Sign in to access your personalized AI_BRUTAL dashboard.</p>
          <Link to="/auth" className="btn-primary-neo">
            Sign In <FiArrowUpRight />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page-neo">
      <div className="dashboard-inner-neo">
        {/* Header */}
        <header className="dashboard-header-neo">
          <div>
            <p className="dashboard-eyebrow mono">DASHBOARD</p>
            <h1 className="dashboard-title">
              Welcome, <span className="highlight">{session.user.email.split('@')[0]}</span>
            </h1>
            <p className="dashboard-subtitle">{session.user.email}</p>
          </div>
          <button className="btn-secondary-neo" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </header>

        {/* Quick stats */}
        <div className="dashboard-stats-row-neo">
          <div className="dashboard-stat-neo">
            <FiGrid />
            <div>
              <span className="dashboard-stat-num">{catalogTools.length}</span>
              <span className="dashboard-stat-label mono">Tools Available</span>
            </div>
          </div>
          <div className="dashboard-stat-neo">
            <FiCompass />
            <div>
              <span className="dashboard-stat-num">{catalogCategories.length}</span>
              <span className="dashboard-stat-label mono">Categories</span>
            </div>
          </div>
          <div className="dashboard-stat-neo">
            <FiZap />
            <div>
              <span className="dashboard-stat-num">{topTools[0]?.score || 0}</span>
              <span className="dashboard-stat-label mono">Top Score</span>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="dashboard-assistant-neo">
          <h2><FiCompass /> AI Recommendation Engine</h2>
          <p>Describe what you need and get personalized tool recommendations.</p>
          <form className="dashboard-search-form-neo" onSubmit={handleSearch}>
            <input
              type="text"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="e.g. I need help writing code faster with AI suggestions..."
              className="input-neo"
            />
            <select
              className="select-neo"
              value={budgetMode}
              onChange={(e) => setBudgetMode(e.target.value)}
            >
              <option value="free">Free Only</option>
              <option value="mixed">Mixed</option>
              <option value="premium">Premium</option>
            </select>
            <button type="submit" className="btn-primary-neo">
              Recommend <FiArrowUpRight />
            </button>
          </form>
        </div>

        {workflow && workflow.steps.length > 0 && (
          <div className="dashboard-workflow-neo">
            <h3><FiGitBranch /> Suggested Workflow ({workflow.budgetMode})</h3>
            <ul className="dashboard-workflow-list-neo">
              {workflow.steps.map((step) => (
                <li key={`${step.role}-${step.primary?.id}`}>
                  <strong>{step.role}:</strong> {step.primary?.name}
                  {step.alternative ? ` (alt: ${step.alternative.name})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div className="dashboard-results-neo">
          <h3>
            {submittedReq ? 'Recommended for you' : 'Top rated tools'}
          </h3>
          <div className="dashboard-results-grid-neo">
            {recommendations.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="dashboard-links-neo">
          <Link to="/tools" className="dashboard-link-card-neo">
            <FiGrid size={24} />
            <span>Browse All Tools</span>
            <FiArrowUpRight />
          </Link>
          <Link to="/submit" className="dashboard-link-card-neo">
            <FiTrendingUp size={24} />
            <span>Submit a Tool</span>
            <FiArrowUpRight />
          </Link>
          <Link to="/about" className="dashboard-link-card-neo">
            <FiCompass size={24} />
            <span>About AI_BRUTAL</span>
            <FiArrowUpRight />
          </Link>
        </div>

        <div className="dashboard-feed-grid-neo">
          <section className="dashboard-feed-card-neo">
            <h3><FiCompass /> Personalized Feed</h3>
            {feedError && <p className="dashboard-feed-empty mono">{feedError}</p>}
            {!feedError && feedItems.length === 0 && <p className="dashboard-feed-empty mono">No personalized suggestions yet.</p>}
            {feedItems.length > 0 && (
              <ul className="dashboard-feed-list-neo">
                {feedItems.map((item) => (
                  <li key={item.id} className="dashboard-feed-item-neo">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.category} · Score {item.score}</p>
                    </div>
                    <a href={item.url} target="_blank" rel="noreferrer" className="mono">Open</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-feed-card-neo">
            <h3><FiBell /> Notifications</h3>
            <div className="dashboard-push-controls-neo">
              <span className="mono">Permission: {notificationPermission} · Subscriptions: {pushSubscriptionCount}</span>
              <div className="dashboard-push-actions-neo">
                <button type="button" className="btn-secondary-neo" onClick={handleEnableNotifications}>
                  Enable
                </button>
                <button
                  type="button"
                  className="btn-secondary-neo"
                  onClick={handleTestNotification}
                  disabled={notificationPermission !== 'granted'}
                >
                  Test
                </button>
              </div>
            </div>
            {pushStatus && <p className="dashboard-feed-empty mono">{pushStatus}</p>}
            {notificationItems.length === 0 && <p className="dashboard-feed-empty mono">No notifications yet.</p>}
            {notificationItems.length > 0 && (
              <ul className="dashboard-feed-list-neo">
                {notificationItems.map((item) => (
                  <li key={item.id} className="dashboard-feed-item-neo">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="dashboard-feed-card-neo">
          <h3><FiZap /> Trend Insights</h3>
          {!trendInsights && <p className="dashboard-feed-empty mono">Trend insights are unavailable right now.</p>}
          {trendInsights && (
            <>
              <div className="dashboard-trend-summary-neo mono">
                <span>Tracked tools: {trendInsights.signals?.tracked_tools ?? 0}</span>
                <span>Categories: {trendInsights.signals?.tracked_categories ?? 0}</span>
                <span>Trending tools: {trendInsights.signals?.trending_tools ?? 0}</span>
              </div>
              <ul className="dashboard-feed-list-neo">
                {(trendInsights.top_categories || []).map((entry) => (
                  <li key={entry.category} className="dashboard-feed-item-neo">
                    <div>
                      <strong>{entry.category}</strong>
                      <p>Momentum {entry.momentum_index} · Avg score {entry.average_score}</p>
                    </div>
                    <span className="mono">{entry.trending_count} trending</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="dashboard-feed-card-neo">
          <h3><FiActivity /> Agent Audit Monitor</h3>
          <p className="dashboard-feed-empty mono">{agentAuditStatus}</p>

          {!agentAuditSnapshot && <p className="dashboard-feed-empty mono">Waiting for first audit cycle...</p>}

          {agentAuditSnapshot && (
            <>
              <div className="dashboard-trend-summary-neo mono">
                <span>Tracked: {agentAuditSnapshot.summary?.trackedTools ?? 0}</span>
                <span>Avg score: {agentAuditSnapshot.summary?.avgScore ?? 0}</span>
                <span>Weekly events: {agentAuditSnapshot.summary?.weeklyEvents ?? 0}</span>
                <span>Helpful votes: {agentAuditSnapshot.summary?.helpfulVotes ?? 0}</span>
                <span>Not helpful: {agentAuditSnapshot.summary?.notHelpfulVotes ?? 0}</span>
              </div>
              <div className="dashboard-sync-health-neo mono">
                <span>Queued local: {syncHealth?.queuedCount ?? 0}</span>
                <span>Synced total: {syncHealth?.syncedTotal ?? 0}</span>
                <span>Last batch: {syncHealth?.lastBatchSynced ?? 0}</span>
                <span>
                  Last success: {syncHealth?.lastSuccessAt ? new Date(syncHealth.lastSuccessAt).toLocaleTimeString() : '—'}
                </span>
                <span className={syncHealth?.lastError ? 'sync-issue' : 'sync-ok'}>
                  {syncHealth?.lastError ? syncHealth.lastError : 'Sync healthy'}
                </span>
              </div>
              <ul className="dashboard-feed-list-neo">
                {(agentAuditSnapshot.scores || []).slice(0, 5).map((tool) => (
                  <li key={tool.id} className="dashboard-feed-item-neo">
                    <div>
                      <strong>{tool.name}</strong>
                      <p>{tool.category} · Agent score {tool.agentScore} · Δ {tool.delta}</p>
                    </div>
                    <span className="mono">{tool.health}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="dashboard-feed-card-neo">
          <h3><FiDollarSign /> Monetization Signals</h3>
          {!agentAuditSnapshot?.monetization && <p className="dashboard-feed-empty mono">Monetization data will appear after the first audit.</p>}
          {agentAuditSnapshot?.monetization && (
            <>
              <div className="dashboard-trend-summary-neo mono">
                <span>Starter: {agentAuditSnapshot.monetization.starterPlan}</span>
                <span>Growth: {agentAuditSnapshot.monetization.growthPlan}</span>
                <span>Enterprise: {agentAuditSnapshot.monetization.enterprisePlan}</span>
              </div>
              <div className="dashboard-monetization-mrr-neo">
                <strong>Estimated MRR: ${agentAuditSnapshot.monetization.estimatedMRR}</strong>
                <p>{agentAuditSnapshot.monetization.conversionHint}</p>
              </div>
            </>
          )}
        </section>

        <section className="dashboard-feed-card-neo">
          <h3><FiCompass /> Profile Preferences</h3>
          <label className="dashboard-profile-label-neo mono">
            Preferred categories (comma-separated)
            <input
              type="text"
              value={preferredCategoriesInput}
              onChange={(event) => setPreferredCategoriesInput(event.target.value)}
              placeholder={catalogCategories.slice(0, 4).join(', ')}
              className="input-neo"
            />
          </label>

          <div className="dashboard-profile-grid-neo">
            <label className="dashboard-profile-label-neo mono">
              Budget mode
              <select
                value={profilePreferences.budget_mode || 'mixed'}
                onChange={(event) => setProfilePreferences((prev) => ({ ...prev, budget_mode: event.target.value }))}
                className="select-neo"
              >
                <option value="free">Free only</option>
                <option value="mixed">Mixed</option>
                <option value="premium">Premium</option>
              </select>
            </label>

            <label className="dashboard-profile-label-neo mono">
              Skill level
              <select
                value={profilePreferences.skill_level || 'intermediate'}
                onChange={(event) => setProfilePreferences((prev) => ({ ...prev, skill_level: event.target.value }))}
                className="select-neo"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>

          <label className="dashboard-profile-check-neo mono">
            <input
              type="checkbox"
              checked={Boolean(profilePreferences.opt_in_personalization)}
              onChange={(event) => setProfilePreferences((prev) => ({ ...prev, opt_in_personalization: event.target.checked }))}
            />
            <span>Enable personalized ranking</span>
          </label>

          <label className="dashboard-profile-check-neo mono">
            <input
              type="checkbox"
              checked={Boolean(profilePreferences.notifications_enabled)}
              onChange={(event) => setProfilePreferences((prev) => ({ ...prev, notifications_enabled: event.target.checked }))}
            />
            <span>Enable recommendation notifications</span>
          </label>

          <button type="button" className="btn-primary-neo" onClick={handleSaveProfilePreferences} disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save Preferences'} <FiArrowUpRight />
          </button>

          {profileStatus && <p className="dashboard-feed-empty mono">{profileStatus}</p>}
        </section>

        {/* Saved Tools */}
        {savedTools.length > 0 && (
          <div className="dashboard-results-neo">
            <h3><FiBookmark /> Your Saved Tools</h3>
            <div className="dashboard-results-grid-neo">
              {savedTools.map((tool) => (
                <div key={tool.id} style={{ position: 'relative' }}>
                  <ToolCard tool={tool} />
                  <button
                    className="btn-icon-danger"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => handleRemoveSaved(tool.id)}
                    title="Remove from saved"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="dashboard-results-neo">
            <h3><FiClock /> Recent Searches</h3>
            <ul className="dashboard-history-list-neo">
              {searchHistory.map((entry) => (
                <li key={entry.id} className="dashboard-history-item-neo mono">
                  <span>{entry.query}</span>
                  <span className="dashboard-history-date-neo">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
