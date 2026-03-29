import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiActivity, FiTag, FiCpu, FiBookmark, FiTrendingUp, FiChevronDown, FiChevronUp, FiUsers, FiClock, FiPackage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getScoreColor } from '../data/aiTools';
import { getToolExternalUrl } from '../shared/toolLinks';
import './ToolCard.css';

function getToolLogoUrl(tool) {
  if (tool.logo_url) return tool.logo_url;

  const externalUrl = getToolExternalUrl(tool);
  if (!externalUrl) return '';

  try {
    const hostname = new URL(externalUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return '';
  }
}

function ScoreBar({ label, value }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${value}%`, background: getScoreColor(value) }}
        />
      </div>
      <span className="score-bar-value">{value}</span>
    </div>
  );
}

function getConfidenceTier(score) {
  if (score >= 90) return 'Elite';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Reliable';
  return 'Emerging';
}

export default function ToolCard({ tool, compact = false, onSave, isSaved = false, onCompare, isCompared = false }) {
  const [expanded, setExpanded] = useState(false);
  const externalUrl = getToolExternalUrl(tool);
  const logoUrl = getToolLogoUrl(tool);
  const highlights = [...(tool.features || []), ...(tool.pros || [])].slice(0, 3);
  const confidenceTier = getConfidenceTier(Number(tool.score || 0));

  return (
    <article className={`tool-card ${compact ? 'compact' : ''} ${tool.trending ? 'trending' : ''}`}>
      {tool.trending && (
        <div className="tool-trending-badge">
          <FiTrendingUp /> TRENDING
        </div>
      )}

      <div className="tool-head">
        <div className="tool-head-title">
          {logoUrl && (
            <img
              className="tool-logo"
              src={logoUrl}
              alt={`${tool.name} logo`}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
          <h3>{tool.name}</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to={`/tools/${tool.id}`} className="tool-link" title="View details">
            <span>Details</span>
            <FiArrowUpRight />
          </Link>
          {onSave && (
            <button
              className={`tool-save-btn ${isSaved ? 'saved' : ''}`}
              onClick={() => onSave(tool.id)}
              title={isSaved ? 'Unsave' : 'Save tool'}
            >
              <FiBookmark />
            </button>
          )}
          {externalUrl ? (
            <a href={externalUrl} target="_blank" rel="noreferrer" className="tool-link">
              <span>Visit</span>
              <FiArrowUpRight />
            </a>
          ) : (
            <span className="tool-link" aria-disabled="true" title="Website unavailable">
              <span>Visit</span>
              <FiArrowUpRight />
            </span>
          )}
        </div>
      </div>

      {tool.developer && (
        <p className="tool-developer">by {tool.developer}</p>
      )}

      <p className="tool-desc">{tool.description}</p>

      <div className="tool-snapshot">
        <div className="tool-snapshot-item">
          <span className="label mono">Confidence</span>
          <span className="value">{confidenceTier}</span>
        </div>
        <div className="tool-snapshot-item">
          <span className="label mono">Best for</span>
          <span className="value">{tool.category}</span>
        </div>
      </div>

      {highlights.length > 0 && (
        <div className="tool-quick-highlights">
          {highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}

      <div className="tool-meta">
        <span><FiTag /> {tool.category}</span>
        <span><FiCpu /> {tool.pricing}</span>
        <span className="tool-score-badge" style={{ borderColor: getScoreColor(tool.score) }}>
          <FiActivity style={{ color: getScoreColor(tool.score) }} /> Score {tool.score}
        </span>
        {tool.version && <span><FiPackage /> v{tool.version}</span>}
      </div>

      {tool.lastUpdated && (
        <div className="tool-update-row">
          <span className="tool-update-info"><FiClock /> Updated {tool.lastUpdated}</span>
          {tool.userBase && <span className="tool-update-info"><FiUsers /> {tool.userBase}</span>}
        </div>
      )}

      <p className="tool-realtime">{tool.realtimeUse}</p>

      <button className="tool-expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? <><FiChevronUp /> Less details</> : <><FiChevronDown /> More details</>}
      </button>

      {onCompare && (
        <button
          type="button"
          className={`tool-compare-btn ${isCompared ? 'active' : ''}`}
          onClick={() => onCompare(tool)}
        >
          {isCompared ? 'Selected for Compare' : 'Add to Compare'}
        </button>
      )}

      {expanded && (
        <div className="tool-details">
          {tool.scoreBreakdown && (
            <div className="tool-score-breakdown">
              <h4>Score Breakdown</h4>
              <ScoreBar label="Accuracy" value={tool.scoreBreakdown.accuracy} />
              <ScoreBar label="Speed" value={tool.scoreBreakdown.speed} />
              <ScoreBar label="Ease of Use" value={tool.scoreBreakdown.ease} />
              <ScoreBar label="Value" value={tool.scoreBreakdown.value} />
            </div>
          )}

          {tool.features && tool.features.length > 0 && (
            <div className="tool-features">
              <h4>Key Features</h4>
              <div className="tool-features-list">
                {tool.features.map((f) => (
                  <span key={f} className="tool-feature-chip">{f}</span>
                ))}
              </div>
            </div>
          )}

          {tool.pros && tool.pros.length > 0 && (
            <div className="tool-pros-cons">
              <div className="tool-pros">
                <h4><FiCheckCircle /> Pros</h4>
                <ul>{tool.pros.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
              {tool.cons && tool.cons.length > 0 && (
                <div className="tool-cons">
                  <h4><FiAlertCircle /> Cons</h4>
                  <ul>{tool.cons.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
