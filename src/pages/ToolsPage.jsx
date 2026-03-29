import { useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiSearch, FiZap, FiTrendingUp, FiCompass } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { addBookmark, fetchBookmarks, fetchTools, removeBookmark, subscribeToolsFeed } from '../lib/apiClient';
import { aiTools, categories as localCategories } from '../data/aiTools';
import CategoryBar from '../components/CategoryBar';
import ToolCard from '../components/ToolCard';
import { extractComparisonMatrix } from '../lib/enhancedRecommendationEngine';
import './ToolsPage.css';

const CACHE_KEY = 'ai_brutal_tools_cache_v1';

const quickIntents = [
  { label: 'Code Faster', query: 'coding assistant', category: 'Coding', icon: FiZap },
  { label: 'Marketing Growth', query: 'marketing automation', category: 'Marketing', icon: FiTrendingUp },
  { label: 'Deep Research', query: 'research summarization', category: 'Research', icon: FiCompass },
  { label: 'Video Creation', query: 'video generation', category: 'Video', icon: FiZap },
];

function readCachedTools() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
      return parsed.items;
    }
    return Array.isArray(aiTools) ? aiTools : [];
  } catch {
    return Array.isArray(aiTools) ? aiTools : [];
  }
}

function pricingMode(value = '') {
  const normalized = String(value).toLowerCase();
  return normalized.includes('free') ? 'free' : 'paid';
}

export default function ToolsPage({ session }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [tools, setTools] = useState(() => {
    const cached = readCachedTools();
    return cached.length > 0 ? cached : [];
  });
  const [savedIds, setSavedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [isOffline, setIsOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [liveFeedConnected, setLiveFeedConnected] = useState(false);
  const [liveFeedUpdatedAt, setLiveFeedUpdatedAt] = useState('');
  const [compareSelection, setCompareSelection] = useState([]);

  const userId = session?.user?.id;

  useEffect(() => {
    const updateOnlineState = () => {
      const offline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
      setIsOffline(offline);
      if (!offline) setOfflineMessage('');
    };

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    const curated = Array.isArray(localCategories) && localCategories.length ? localCategories : ['All'];
    setCategories(curated);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadTools() {
      setIsLoading(true);
      setApiError('');

      try {
        const response = await fetchTools({
          limit: 2500,
          category: activeCategory,
          q: searchQuery.trim() || undefined,
          pricing: pricingFilter === 'all' ? undefined : pricingFilter,
          sort: sortBy === 'name' ? 'name' : 'score',
        });

        if (ignore) return;
        const loadedTools = response?.items || [];
        setTools(loadedTools);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ items: loadedTools, savedAt: Date.now() }));

        if (response?.__fromCache) {
          setOfflineMessage('Showing cached tools due to connection limits.');
        }
      } catch {
        if (ignore) return;

        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            const cachedItems = Array.isArray(cached?.items) ? cached.items : [];
            setTools(cachedItems);
            setOfflineMessage('Offline mode: showing saved tools from this device.');
          } catch {
            setTools([]);
            setApiError('Unable to load tools from API or cache.');
          }
        } else {
          setTools([]);
          setApiError('Unable to load tools from API.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadTools();

    return () => {
      ignore = true;
    };
  }, [activeCategory, pricingFilter, searchQuery, sortBy]);

  useEffect(() => {
    const unsubscribe = subscribeToolsFeed({
      onSnapshot: (payload) => {
        const items = payload?.items || [];
        if (!Array.isArray(items) || items.length === 0) return;

        setLiveFeedConnected(true);
        setLiveFeedUpdatedAt(payload?.generated_at || new Date().toISOString());

        setTools(items);

        if (Array.isArray(payload?.categories) && payload.categories.length > 0) {
          const categoryNames = ['All', ...payload.categories.map((entry) => entry.name).filter(Boolean)];
          setCategories(Array.from(new Set(categoryNames)));
        }
      },
      onError: () => {
        setLiveFeedConnected(false);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setSavedIds(new Set());
      return;
    }

    fetchBookmarks()
      .then((payload) => {
        const ids = (payload?.items || []).map((item) => item.id).filter(Boolean);
        setSavedIds(new Set(ids));
      })
      .catch(() => {
        setSavedIds(new Set());
      });
  }, [userId]);

  const filteredTools = useMemo(() => {
    const categoryFiltered = tools.filter((tool) => {
      if (activeCategory === 'All') return true;
      return String(tool.category || '').toLowerCase() === String(activeCategory).toLowerCase();
    });

    const searched = categoryFiltered.filter((tool) => {
      const haystack = `${tool.name || ''} ${tool.description || ''} ${(tool.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });

    const priced = searched.filter((tool) => pricingFilter === 'all' || pricingMode(tool.pricing) === pricingFilter);

    const sorted = [...priced];
    if (sortBy === 'name') {
      sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else {
      sorted.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    }

    return sorted;
  }, [tools, activeCategory, searchQuery, pricingFilter, sortBy]);

  const comparedTools = useMemo(() => {
    if (compareSelection.length === 0) return [];
    const selected = new Set(compareSelection);
    return tools.filter((tool) => selected.has(tool.id));
  }, [compareSelection, tools]);

  const leaderboardTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 5);
  }, [tools]);

  const handleToggleCompare = (tool) => {
    setCompareSelection((prev) => {
      const exists = prev.includes(tool.id);
      if (exists) {
        return prev.filter((id) => id !== tool.id);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), tool.id];
      }
      return [...prev, tool.id];
    });
  };

  const handleCompareSelected = () => {
    if (comparedTools.length < 2) return;

    navigate('/compare', {
      state: {
        selectedTools: comparedTools,
        comparisonData: extractComparisonMatrix(comparedTools),
        source: 'tools_page',
      },
    });
  };

  const handleToggleSave = async (toolId) => {
    if (!userId) return;

    if (savedIds.has(toolId)) {
      await removeBookmark(toolId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(toolId);
        return next;
      });
      return;
    }

    await addBookmark(toolId);
    setSavedIds((prev) => new Set(prev).add(toolId));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPricingFilter('all');
    setSortBy('score');
  };

  const applyIntent = (intent) => {
    setSearchQuery(intent.query);
    if (intent.category) {
      setActiveCategory(intent.category);
    }
  };

  return (
    <section className="tools-page-neo">
      <div className="tools-header-neo">
        <p className="tools-eyebrow">TOOLS</p>
        <h1 className="tools-title">Find the right AI tool</h1>
        <p className="tools-subtitle">Discover, shortlist, and compare tools with a modern recommendation workflow inspired by top AI discovery platforms.</p>
        <div className="tools-stats">
          <span>{tools.length} tools indexed</span>
          <span>{Math.max(categories.length - 1, 0)} categories</span>
          <span className={`tools-status ${liveFeedConnected ? 'connected' : 'disconnected'}`}>
            {liveFeedConnected ? 'Realtime updates on' : 'Realtime optional'}
          </span>
        </div>
      </div>

      <div className="tools-main-neo">
        <div className="tools-content-column">
          <CategoryBar categories={categories} activeCategory={activeCategory} onChange={setActiveCategory} />

          <div className="tools-intent-grid">
            {quickIntents.map((intent) => {
              const Icon = intent.icon;
              return (
                <button key={intent.label} type="button" className="tools-intent-btn" onClick={() => applyIntent(intent)}>
                  <Icon size={14} />
                  <span>{intent.label}</span>
                </button>
              );
            })}
          </div>

          <div className="tools-toolbar-neo">
            <span className="tools-count">
              {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
            </span>
            {(isOffline || offlineMessage) && (
              <span className="tools-status-offline">
                {offlineMessage || 'Offline mode active.'}
              </span>
            )}
            <span className="tools-status-live">
              Ranked by trust score, relevance, and utility
            </span>
          </div>

          {leaderboardTools.length > 0 && (
            <div className="tools-leaderboard-neo">
              <p className="tools-leaderboard-title">Top picks leaderboard</p>
              <div className="tools-leaderboard-list">
                {leaderboardTools.map((tool, index) => (
                  <button
                    key={tool.id}
                    type="button"
                    className="tools-leaderboard-item"
                    onClick={() => setSearchQuery(tool.name || '')}
                  >
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{tool.name}</span>
                    <span className="score">{tool.score || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {compareSelection.length > 0 && (
            <div className="tools-compare-bar-neo">
              <span>Selected for compare: {comparedTools.length} / 5</span>
              <div className="tools-compare-actions">
                <button type="button" className="tools-clear-btn" onClick={() => setCompareSelection([])}>
                  Clear
                </button>
                <button type="button" className="tools-compare-btn" onClick={handleCompareSelected} disabled={comparedTools.length < 2}>
                  Compare tools
                </button>
              </div>
            </div>
          )}

          {isLoading && tools.length === 0 && <div className="tools-page-empty">Loading tools...</div>}
          {apiError && <div className="tools-page-empty">{apiError}</div>}

          <div className="tools-grid-neo">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSave={userId ? handleToggleSave : undefined}
                isSaved={savedIds.has(tool.id)}
                onCompare={handleToggleCompare}
                isCompared={compareSelection.includes(tool.id)}
              />
            ))}
          </div>

          {!isLoading && !apiError && filteredTools.length === 0 && (
            <div className="tools-page-empty">No tools found. Try a different search.</div>
          )}
        </div>

        <aside className="tools-sidebar-neo">
          <div className="tools-filter-header">
            <p className="tools-filter-title">Refine results</p>
            <p className="tools-filter-desc">Narrow down quickly using search, pricing, and ranking.</p>
          </div>

          <div className="tools-search-input">
            <FiSearch size={16} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tools"
            />
          </div>

          <div className="tools-filter-controls">
            <label>
              Pricing
              <select value={pricingFilter} onChange={(event) => setPricingFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="free">Free / Freemium</option>
                <option value="paid">Paid</option>
              </select>
            </label>

            <label>
              Sort
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="score">Top Score</option>
                <option value="name">A → Z</option>
              </select>
            </label>

            <button type="button" className="tools-reset-btn" onClick={resetFilters}>
              <FiRefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div className="tools-active-filters">
            <span>Active</span>
            <div className="tools-filter-chips">
              <span>{activeCategory}</span>
              <span>{pricingFilter === 'all' ? 'Any pricing' : pricingFilter}</span>
              <span>{sortBy === 'score' ? 'Top Score' : 'A → Z'}</span>
            </div>
          </div>

          {liveFeedUpdatedAt && (
            <p className="tools-feed-time">Last sync: {new Date(liveFeedUpdatedAt).toLocaleTimeString()}</p>
          )}
        </aside>
      </div>
    </section>
  );
}
