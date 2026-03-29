import { Link } from 'react-router-dom';
import './CTASection.css';

export default function CTASection() {
  return (
    <section className="cta-section" id="cta">
      <div className="floating-shape" />
      <div className="floating-shape" />
      <div className="floating-shape" />
      <div className="floating-shape" />

      <div className="cta-content">
        <div className="cta-badge mono">
          <span className="cta-badge-dot" />
          EARLY ACCESS OPEN
        </div>
        <h2 className="display">
          Ready to build<br />with AI?
        </h2>
        <p>
          Get API access in minutes. Start with 10K free inference calls.
          No credit card. No black boxes. Just raw intelligence.
        </p>
        <div className="cta-buttons">
          <Link to="/auth" className="btn btn-primary cta-btn-main">
            GET STARTED →
          </Link>
          <Link to="/tools" className="btn btn-secondary cta-btn-docs">
            BROWSE TOOLS
          </Link>
        </div>
        <div className="cta-terminal mono">
          <span className="terminal-prompt">$</span> npm run recommendex:start<br />
          <span className="terminal-prompt">$</span> recommendex recommend --goal "build faster"<br />
          <span className="terminal-success">✓ Top 5 tool matches ready.</span>
        </div>
      </div>
    </section>
  );
}
