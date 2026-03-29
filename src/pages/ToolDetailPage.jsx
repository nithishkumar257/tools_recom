import { Link, useParams } from 'react-router-dom';
import { FiArrowUpRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { aiTools } from '../data/aiTools';
import { getToolExternalUrl } from '../shared/toolLinks';
import './ToolDetailPage.css';

export default function ToolDetailPage() {
  const { toolId } = useParams();
  const tool = aiTools.find((entry) => entry.id === toolId);

  if (!tool) {
    return (
      <section className="tool-detail-page-neo">
        <div className="tool-detail-not-found">
          <h1>NODE_NOT_FOUND</h1>
          <p>The requested tool node does not exist in the current index.</p>
          <Link to="/tools">Return to Tool Index</Link>
        </div>
      </section>
    );
  }

  const alternatives = aiTools
    .filter((entry) => entry.category === tool.category && entry.id !== tool.id)
    .slice(0, 3);

  return (
    <section className="tool-detail-page-neo">
      <div className="tool-detail-shell">
        <header className="tool-detail-header">
          <p className="tool-detail-eyebrow">DEPLOY_PRESET // LIVE_SYSTEM</p>
          <h1>{tool.name.toUpperCase().replace(/\s+/g, '_')}</h1>
          <p>{tool.description}</p>
        </header>

        <div className="tool-detail-grid">
          <article className="tool-detail-main">
            <h2>TECHNICAL_CAPABILITIES</h2>
            <p>{tool.realtimeUse}</p>
            <div className="detail-metrics">
              <span>CORE SCORE <strong>{tool.score}</strong></span>
              <span>PERFORMANCE <strong>{tool.scoreBreakdown?.speed || 0}</strong></span>
              <span>VALUE <strong>{tool.scoreBreakdown?.value || 0}</strong></span>
              <span>POPULARITY <strong>{tool.userBase || 'N/A'}</strong></span>
            </div>

            <div className="detail-pros-cons">
              <div>
                <h3><FiCheckCircle /> STRENGTHS (+)</h3>
                <ul>{(tool.pros || []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <h3><FiXCircle /> LIMITATION (-)</h3>
                <ul>{(tool.cons || []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          </article>

          <aside className="tool-detail-aside">
            <div className="detail-tier-card">
              <h3>ACCESS TIERS</h3>
              <p>Pricing mode: <strong>{tool.pricing}</strong></p>
              <a href={getToolExternalUrl(tool)} target="_blank" rel="noreferrer">
                VISIT_WEBSITE <FiArrowUpRight />
              </a>
            </div>

            <div className="detail-tier-card">
              <h3>SYSTEM ALTERNATIVES</h3>
              {alternatives.map((item) => (
                <Link key={item.id} to={`/tools/${item.id}`}>
                  {item.name}
                </Link>
              ))}
              {alternatives.length === 0 && <span>No alternatives indexed.</span>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
