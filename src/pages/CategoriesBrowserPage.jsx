import { Link } from 'react-router-dom';
import './CategoriesBrowserPage.css';

const layers = [
  { name: 'CODE GENERATION', tools: 120 },
  { name: 'DATABASES & BACKEND', tools: 84 },
  { name: 'DEPLOYMENT & HOSTING', tools: 45 },
  { name: 'AI/ML PLATFORMS', tools: 210 },
  { name: 'DESIGN & CREATIVE', tools: 156 },
  { name: 'DATA ANALYTICS', tools: 92 },
  { name: 'NLP & TEXT GENERATION', tools: 312 },
  { name: 'ROBOTICS & IOT EDGE', tools: 38 },
];

export default function CategoriesBrowserPage() {
  return (
    <section className="categories-browser-page-neo">
      <div className="categories-browser-shell">
        <header className="categories-browser-header">
          <p className="eyebrow">SYSTEM_READY</p>
          <h1>TOOL_ARCHITECTURE</h1>
          <p>
            Filter through high-performance models categorized by execution layer
            and industrial utility.
          </p>
        </header>

        <div className="categories-layer-list">
          {layers.map((layer, index) => (
            <Link key={layer.name} to="/tools" className="categories-layer-card">
              <small>LAYER 0{index + 1}</small>
              <h2>{layer.name}</h2>
              <span>{layer.tools} TOOLS</span>
            </Link>
          ))}
        </div>

        <div className="categories-integrity-row">
          <article>
            <small>SYNC STATUS</small>
            <strong>99.9% LIVE</strong>
          </article>
          <article>
            <small>TOTAL ENTITIES</small>
            <strong>1,402 NODES</strong>
          </article>
        </div>
      </div>
    </section>
  );
}
