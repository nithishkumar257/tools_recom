import React, { useEffect, useMemo, useState } from 'react';
import { FiClock, FiShield, FiTrendingUp, FiX } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { aiTools } from '../data/aiTools';
import { trackToolEvent } from '../lib/agentPerformanceService';
import { fetchToolComparison } from '../lib/apiClient';
import './ComparisonPage.css';

function parseRating(value) {
  const rating = Number(value || 0);
  if (!Number.isFinite(rating) || rating < 0) return 0;
  return Math.min(rating, 5) * 20;
}

function parseFreshnessScore(lastUpdated) {
  if (!lastUpdated) return 40;
  const parsed = new Date(lastUpdated);
  if (Number.isNaN(parsed.getTime())) return 40;
  const days = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 100;
  if (days <= 90) return 85;
  if (days <= 180) return 70;
  if (days <= 365) return 55;
  return 40;
}

function parseAdoptionScore(userBase) {
  const text = String(userBase || '').toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)\s*([kmb])/i);
  if (!match) return 45;
  const numeric = Number(match[1] || 0);
  const unit = match[2]?.toLowerCase();
  const multiplier = unit === 'm' ? 1000000 : unit === 'b' ? 1000000000 : 1000;
  const size = numeric * multiplier;
  if (size >= 10000000) return 100;
  if (size >= 1000000) return 90;
  if (size >= 200000) return 75;
  if (size >= 50000) return 65;
  return 50;
}

function parsePricingScore(pricing) {
  const text = String(pricing || '').toLowerCase();
  if (!text) return 50;
  if (text.includes('free') && text.includes('paid')) return 88;
  if (text.includes('free')) return 94;
  if (text.includes('freemium')) return 86;
  if (text.includes('enterprise')) return 62;
  if (text.includes('paid')) return 72;
  return 60;
}

function computeComparisonScore(tool) {
  const score = Number(tool.score || 0);
  const performance = Number(tool.performance_score || score);
  const value = Number(tool.value_score || score);
  const community = parseRating(tool.community_rating);
  const freshness = parseFreshnessScore(tool.lastUpdated);
  const adoption = parseAdoptionScore(tool.userBase);
  const pricing = parsePricingScore(tool.pricing);

  return Math.round(
    score * 0.33 +
    performance * 0.18 +
    value * 0.18 +
    community * 0.14 +
    freshness * 0.07 +
    adoption * 0.05 +
    pricing * 0.05
  );
}

function confidenceLabel(tool) {
  const checks = [tool.score, tool.performance_score, tool.value_score, tool.community_rating, tool.lastUpdated, tool.userBase];
  const completeness = checks.filter((entry) => entry !== undefined && entry !== null && String(entry).trim() !== '').length / checks.length;
  if (completeness >= 0.83) return 'High confidence';
  if (completeness >= 0.6) return 'Medium confidence';
  return 'Low confidence';
}

function buildProsCons(tool) {
  const generatedPros = [];
  const generatedCons = [];
  const freshness = parseFreshnessScore(tool.lastUpdated);
  const adoption = parseAdoptionScore(tool.userBase);
  const pricing = parsePricingScore(tool.pricing);
  const performance = Number(tool.performance_score || tool.score || 0);
  const value = Number(tool.value_score || tool.score || 0);

  if (performance >= 80) generatedPros.push('Strong performance on complex workflows.');
  if (value >= 80 || pricing >= 86) generatedPros.push('Good value for cost and entry accessibility.');
  if (freshness >= 85) generatedPros.push(`Recently updated (${tool.lastUpdated || 'latest cycle'}), improving reliability.`);
  if (adoption >= 75) generatedPros.push(`Large active adoption signal (${tool.userBase || 'broad user base'}).`);

  if (performance <= 65) generatedCons.push('Performance can be inconsistent for advanced tasks.');
  if (value <= 60 && pricing <= 72) generatedCons.push('Pricing-to-value may be weaker for budget-sensitive teams.');
  if (freshness <= 55) generatedCons.push('Update cadence appears slower than top alternatives.');
  if (adoption <= 55) generatedCons.push('Smaller adoption footprint may limit community learning resources.');

  return {
    pros: generatedPros,
    cons: generatedCons,
  };
}

const ComparisonPage = ({ session }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTools = useMemo(() => {
    const stateTools = location.state?.selectedTools;
    if (Array.isArray(stateTools) && stateTools.length > 0) {
      return stateTools;
    }

    return aiTools.slice(0, 2);
  }, [location.state]);

  const [selectedTools, setSelectedTools] = useState(initialTools);
  const [toolSearch, setToolSearch] = useState('');
  const [liveComparison, setLiveComparison] = useState(null);
  const [liveSyncError, setLiveSyncError] = useState('');

  const comparisonData = location.state?.comparisonData;

  useEffect(() => {
    if (selectedTools.length < 2) {
      return;
    }

    if (!session) {
      return;
    }

    let cancelled = false;

    const sync = async () => {
      try {
        const payload = await fetchToolComparison(selectedTools.map((tool) => tool.id));
        if (cancelled) return;
        setLiveComparison(payload);
        setLiveSyncError('');
      } catch {
        if (cancelled) return;
        setLiveSyncError('Live review unavailable. Showing local comparison data.');
      }
    };

    sync();
    const timer = window.setInterval(sync, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedTools, session]);

  const liveSyncStatus = useMemo(() => {
    if (!session) {
      return 'Sign in for high-accuracy live comparison and recommendation insights.';
    }

    if (selectedTools.length < 2) {
      return 'Select at least 2 tools for live comparison.';
    }

    if (liveSyncError) {
      return liveSyncError;
    }

    if (liveComparison?.generated_at) {
      return `Live review updated at ${new Date(liveComparison.generated_at).toLocaleTimeString()}`;
    }

    if (liveComparison) {
      return 'Live review updated.';
    }

    return 'Syncing live review...';
  }, [selectedTools.length, liveSyncError, liveComparison, session]);

  const liveItemsById = useMemo(() => {
    if (!session) {
      return new Map();
    }

    const map = new Map();
    const items = liveComparison?.items || [];
    for (const item of items) {
      if (item?.id) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [liveComparison, session]);

  const availableTools = useMemo(() => {
    const selectedIds = new Set(selectedTools.map((tool) => tool.id));
    const query = toolSearch.trim().toLowerCase();

    return aiTools
      .filter((tool) => !selectedIds.has(tool.id))
      .filter((tool) => {
        if (!query) return true;
        const haystack = `${tool.name || ''} ${tool.category || ''} ${tool.description || ''}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 12);
  }, [selectedTools, toolSearch]);

  const features = useMemo(() => {
    if (comparisonData?.features?.length) {
      return comparisonData.features.map((feature) => ({
        label: feature.label,
        key: feature.key,
      }));
    }

    return [
      { label: 'Score', key: 'score' },
      { label: 'Performance', key: 'performance_score' },
      { label: 'Value', key: 'value_score' },
      { label: 'Community Rating', key: 'community_rating' },
      { label: 'Price/Month', key: 'pricing' },
      { label: 'Free Tier', key: 'freeTier' },
      { label: 'Category', key: 'category' },
      { label: 'Integrations', key: 'integrations' },
      { label: 'Last Updated', key: 'lastUpdated' },
      { label: 'User Base', key: 'userBase' },
    ];
  }, [comparisonData]);

  const displayTools = useMemo(() => {
    return selectedTools.map((tool) => {
      const mergedTool = {
        ...tool,
        ...(liveItemsById.get(tool.id) || {}),
      };

      const accuracyScore = computeComparisonScore(mergedTool);
      const inferred = buildProsCons(mergedTool);

      return {
        ...mergedTool,
        accuracyScore,
        confidence: confidenceLabel(mergedTool),
        freeTier: mergedTool.freeTier || (String(mergedTool.pricing || '').toLowerCase().includes('free') ? 'Yes' : 'No'),
        integrations: mergedTool.integrations || 'N/A',
        support: mergedTool.support || (String(mergedTool.pricing || '').toLowerCase().includes('paid') ? 'Priority' : 'Community'),
        pros:
          Array.isArray(mergedTool.pros) && mergedTool.pros.length > 0 && !mergedTool.pros.every((entry) => String(entry).toLowerCase().startsWith('pro '))
            ? mergedTool.pros
            : inferred.pros,
        cons:
          Array.isArray(mergedTool.cons) && mergedTool.cons.length > 0 && !mergedTool.cons.every((entry) => String(entry).toLowerCase().startsWith('con '))
            ? mergedTool.cons
            : inferred.cons,
      };
    });
  }, [selectedTools, liveItemsById]);

  const comparisonRecommendation = useMemo(() => {
    if (displayTools.length < 2) return null;

    const ranked = [...displayTools].sort((a, b) => Number(b.accuracyScore || 0) - Number(a.accuracyScore || 0));
    const winner = ranked[0];
    const challenger = ranked[1];
    const bestBudget = [...displayTools].sort((a, b) => parsePricingScore(b.pricing) - parsePricingScore(a.pricing))[0];
    const bestPerformance = [...displayTools].sort((a, b) => Number(b.performance_score || b.score || 0) - Number(a.performance_score || a.score || 0))[0];

    return {
      winner,
      challenger,
      bestBudget,
      bestPerformance,
      ranked,
      gap: Math.max(0, Number(winner?.accuracyScore || 0) - Number(challenger?.accuracyScore || 0)),
    };
  }, [displayTools]);

  const removeTool = (id) => {
    setSelectedTools(selectedTools.filter((t) => t.id !== id));
  };

  const addTool = (tool) => {
    if (selectedTools.some((entry) => entry.id === tool.id)) {
      return;
    }
    if (selectedTools.length >= 5) {
      return;
    }
    setSelectedTools([...selectedTools, tool]);
  };

  const getFeatureValue = (tool, feature) => {
    if (comparisonData?.matrix?.[tool.id]?.[feature.key] !== undefined) {
      return comparisonData.matrix[tool.id][feature.key];
    }

    return tool[feature.key] ?? 'N/A';
  };

  return (
    <div className="comparison-page-neo">
      <div className="comparison-container-neo">
        {/* Header */}
        <header className="comparison-header-neo">
          <h1 className="comparison-title-neo">Compare Tools</h1>
          <p className="comparison-subtitle-neo">
            Compare shortlisted recommendations before you choose
          </p>
          <p className="comparison-status">{liveSyncStatus}</p>
          {!session && (
            <div className="comparison-auth-notice">
              <FiShield size={16} />
              <span>Sign in to unlock high-accuracy live comparisons and smart winner recommendations.</span>
              <Link to="/auth" className="comparison-login-link">Sign in</Link>
            </div>
          )}
        </header>

        <section className="comparison-add-section">
          <h3 className="add-tools-title">Add More Tools (up to 5)</h3>
          <input
            type="search"
            className="comparison-search-input"
            placeholder="Search tools by name, category, or keyword"
            value={toolSearch}
            onChange={(event) => setToolSearch(event.target.value)}
          />
          <div className="comparison-tool-suggestions">
            {availableTools.map((tool) => (
              <button
                type="button"
                key={tool.id}
                className="suggestion-btn"
                onClick={() => addTool(tool)}
                disabled={selectedTools.length >= 5}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </section>

        {displayTools.length < 2 && (
          <div className="comparison-empty-state">
            <p>Select at least 2 tools from Stack Builder to compare them side-by-side.</p>
            <button className="btn-primary-neo" onClick={() => navigate('/stack')}>
              Go to Stack Builder
            </button>
          </div>
        )}

        {/* Comparison Table */}
        {displayTools.length >= 1 && (
        <div className="comparison-table-container">
          <table className="comparison-table-neo">
            <thead>
              <tr>
                <th className="feature-column">Feature</th>
                {displayTools.map((tool) => (
                  <th key={tool.id} className="tool-column">
                    <div className="tool-header-neo">
                      <h3>{tool.name}</h3>
                      <button
                        className="btn-remove-tool"
                        onClick={() => removeTool(tool.id)}
                        title="Remove from comparison"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.key}>
                  <td className="feature-name">{feature.label}</td>
                  {displayTools.map((tool) => (
                    <td key={tool.id} className="feature-value">
                      {getFeatureValue(tool, feature)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="feature-name">Accuracy Score</td>
                {displayTools.map((tool) => (
                  <td key={tool.id} className="feature-value accuracy-score">{tool.accuracyScore}</td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Confidence</td>
                {displayTools.map((tool) => (
                  <td key={tool.id} className="feature-value">{tool.confidence}</td>
                ))}
              </tr>
              <tr className="divider-row">
                <td colSpan={displayTools.length + 1}></td>
              </tr>
              <tr>
                <td className="feature-name">Pros</td>
                {displayTools.map((tool) => (
                  <td key={tool.id} className="pros-cell">
                    <ul className="pros-list">
                      {tool.pros.map((pro, idx) => (
                        <li key={idx}>
                          <span className="pro-indicator">✓</span>
                          {pro}
                        </li>
                      ))}
                      {tool.pros.length === 0 && <li><span className="pro-indicator">✓</span>Balanced general-purpose profile.</li>}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Cons</td>
                {displayTools.map((tool) => (
                  <td key={tool.id} className="cons-cell">
                    <ul className="cons-list">
                      {tool.cons.map((con, idx) => (
                        <li key={idx}>
                          <span className="con-indicator">✗</span>
                          {con}
                        </li>
                      ))}
                      {tool.cons.length === 0 && <li><span className="con-indicator">✗</span>No major limitation data available yet.</li>}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        )}

        {/* Actions */}
        <div className="comparison-actions-bar">
          {displayTools.map((tool) => (
            <a
              key={tool.id}
              className="btn-choose-tool"
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackToolEvent(tool.id, 'choose_from_compare')}
            >
              Choose {tool.name}
            </a>
          ))}
          <Link to="/stack" className="btn-back-builder">Back to Builder</Link>
        </div>

        {comparisonRecommendation && (
          <div className="comparison-recommendation-box">
            <h3>AI Recommendation Based on Comparison</h3>
            <p>
              Best overall: <strong>{comparisonRecommendation.winner?.name}</strong> (accuracy {comparisonRecommendation.winner?.accuracyScore})
              {comparisonRecommendation.gap > 0 ? ` · lead ${comparisonRecommendation.gap} points` : ''}
            </p>
            <div className="recommendation-grid">
              <div>
                <p>Best value</p>
                <strong>{comparisonRecommendation.bestBudget?.name}</strong>
              </div>
              <div>
                <p>Best performance</p>
                <strong>{comparisonRecommendation.bestPerformance?.name}</strong>
              </div>
              <div>
                <p>Runner-up</p>
                <strong>{comparisonRecommendation.challenger?.name || 'N/A'}</strong>
              </div>
            </div>
            <div className="recommendation-ranking">
              {comparisonRecommendation.ranked.map((tool, index) => (
                <span key={tool.id}><FiTrendingUp size={14} /> #{index + 1} {tool.name} · {tool.accuracyScore}</span>
              ))}
            </div>
          </div>
        )}

        {/* Guide */}
        <div className="comparison-guide-section">
          <h3>How to Choose</h3>
          {liveComparison?.generated_at && <p className="guide-insight"><FiClock size={14} /> Updated {new Date(liveComparison.generated_at).toLocaleTimeString()}</p>}
          {liveComparison?.insights?.best_by_score && (
            <p className="guide-insight">
              Live winner: <strong>{liveComparison.insights.best_by_score.name}</strong> (score {liveComparison.insights.best_by_score.score})
            </p>
          )}
          <ul>
            <li>
              <strong>Budget conscious?</strong> Look at pricing and free tier
              availability
            </li>
            <li>
              <strong>Need integrations?</strong> Check the integrations count
            </li>
            <li>
              <strong>Quick setup?</strong> Compare setup time to get started
              fast
            </li>
            <li>
              <strong>Team collaboration?</strong> Look at support options and
              community
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
