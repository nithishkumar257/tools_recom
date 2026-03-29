import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiBarChart2, FiShield, FiTrendingUp } from 'react-icons/fi';
import { fetchToolAnalytics, fetchTools } from '../lib/apiClient';
import './ToolMakerPage.css';

export default function ToolMakerPage({ session }) {
  const [tools, setTools] = useState([]);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      setTools([]);
      setSelectedToolId('');
      setAnalytics(null);
      setLeaderboard([]);
      setError('');
      return;
    }

    let ignore = false;

    async function bootstrap() {
      try {
        setIsLoading(true);
        setError('');

        const toolsResponse = await fetchTools({ limit: 30, sort: 'score' });
        if (ignore) return;

        const items = toolsResponse?.items || [];
        setTools(items);
        const initialToolId = items[0]?.id || '';
        setSelectedToolId(initialToolId);

        if (!initialToolId) {
          setAnalytics(null);
          setLeaderboard([]);
          return;
        }

        const [mainAnalytics, leaderboardRows] = await Promise.all([
          fetchToolAnalytics(initialToolId),
          Promise.all(items.slice(0, 8).map(async (tool) => {
            try {
              const row = await fetchToolAnalytics(tool.id);
              return row;
            } catch {
              return null;
            }
          })),
        ]);

        if (ignore) return;

        setAnalytics(mainAnalytics || null);
        const topRows = leaderboardRows
          .filter(Boolean)
          .sort((a, b) => (b?.metrics?.trend_index || 0) - (a?.metrics?.trend_index || 0));
        setLeaderboard(topRows);
      } catch (apiError) {
        if (!ignore) {
          setError(apiError?.message || 'Unable to load tool maker dashboard data.');
          setTools([]);
          setAnalytics(null);
          setLeaderboard([]);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !selectedToolId) {
      setAnalytics(null);
      return;
    }

    let ignore = false;
    setIsLoading(true);
    fetchToolAnalytics(selectedToolId)
      .then((payload) => {
        if (!ignore) {
          setAnalytics(payload || null);
          setError('');
        }
      })
      .catch((apiError) => {
        if (!ignore) {
          setAnalytics(null);
          setError(apiError?.message || 'Unable to load selected tool analytics.');
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [session, selectedToolId]);

  const latestReviews = useMemo(() => analytics?.latest_reviews || [], [analytics]);

  if (!session) {
    return (
      <section className="tool-maker-page">
        <div className="tool-maker-locked">
          <FiShield size={48} />
          <h1 className="display">Access Required</h1>
          <p>Sign in to access the tool maker dashboard.</p>
          <Link to="/auth" className="tool-maker-btn-primary">
            Sign In <FiArrowUpRight />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="tool-maker-page">
      <div className="tool-maker-inner">
        <header className="tool-maker-header">
          <div>
            <p className="tool-maker-eyebrow mono">TOOL MAKER DASHBOARD</p>
            <h1 className="display">Listing Analytics</h1>
            <p>Track listing performance with trend and engagement metrics.</p>
          </div>
          <Link to="/dashboard" className="tool-maker-btn-ghost">Back to Dashboard</Link>
        </header>

        <div className="tool-maker-grid">
          <section className="tool-maker-card">
            <h2 className="display"><FiBarChart2 /> Your Tool Snapshot</h2>

            <label className="mono tool-maker-label">
              Select Tool
              <select
                value={selectedToolId}
                onChange={(event) => setSelectedToolId(event.target.value)}
                disabled={tools.length === 0}
              >
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>{tool.name}</option>
                ))}
              </select>
            </label>

            {isLoading && <p className="mono">Loading analytics...</p>}
            {error && <p className="mono tool-maker-error">{error}</p>}

            {analytics?.metrics && (
              <div className="tool-maker-metrics">
                <span>Bookmarks <strong>{analytics.metrics.bookmarks}</strong></span>
                <span>Collections <strong>{analytics.metrics.collections}</strong></span>
                <span>Reviews <strong>{analytics.metrics.reviews}</strong></span>
                <span>Avg Rating <strong>{analytics.metrics.average_rating}</strong></span>
                <span>Trend Index <strong>{analytics.metrics.trend_index}</strong></span>
              </div>
            )}

            <div className="tool-maker-reviews">
              <h3 className="display">Latest Reviews</h3>
              {latestReviews.length === 0 && <p className="mono">No recent reviews for this listing.</p>}
              {latestReviews.map((item, index) => (
                <article key={`${item.created_at}-${index}`} className="tool-maker-review-item">
                  <div className="mono">
                    {'★'.repeat(Math.max(1, Math.min(5, item.rating || 0)))} · {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <p>{item.comment || 'No review text provided.'}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="tool-maker-card">
            <h2 className="display"><FiTrendingUp /> Top Listing Momentum</h2>
            <ul className="tool-maker-leaderboard">
              {leaderboard.length === 0 && <li className="mono">No ranking data available.</li>}
              {leaderboard.map((row, index) => (
                <li key={`${row?.tool?.id}-${index}`}>
                  <span className="mono">#{index + 1}</span>
                  <div>
                    <strong>{row?.tool?.name || 'Unknown tool'}</strong>
                    <p>{row?.tool?.category || 'General'}</p>
                  </div>
                  <span className="mono">{row?.metrics?.trend_index || 0}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}