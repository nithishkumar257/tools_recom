import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/recommendex-logo.png';
import './Hero.css';

export default function Hero() {
  const [typed, setTyped] = useState('');
  const fullText = 'AI Tool Discovery';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setTyped(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(timer);
    }, 55);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg-shapes" aria-hidden="true">
        <div className="hero-shape hero-shape--1" />
        <div className="hero-shape hero-shape--2" />
        <div className="hero-shape hero-shape--3" />
      </div>

      <div className="hero-text" style={{ animation: 'fadeSlideUp .8s ease-out both' }}>
        <div className="hero-badge mono">
          <span className="badge-dot" /> PERSONALIZED AI RECOMMENDATIONS
        </div>
        <div className="hero-brand">
          <img src={logoMark} alt="RecommenDex logo" className="hero-brand-logo" />
          <span className="hero-brand-name">RecommenDex</span>
        </div>
        <h1 className="display">
          Find your next<br />
          <span className="highlight-box">{typed}<span className="cursor-blink">|</span></span>
        </h1>
        <p className="hero-description">
          RecommenDex helps you discover, compare, and pick the right AI tools for your workflow.
          Smart rankings, trusted signals, and a fast neo-brutal experience built for builders.
        </p>
        <div className="cta-group">
          <Link to="/auth" className="btn btn-primary">GET STARTED →</Link>
          <Link to="/tools" className="btn btn-secondary">EXPLORE TOOLS</Link>
        </div>
        <div className="hero-stats-row">
          <div className="mini-stat">
            <span className="mono">8K+</span>
            <small>Curated Tools</small>
          </div>
          <div className="mini-stat">
            <span className="mono">95%</span>
            <small>Match Quality</small>
          </div>
          <div className="mini-stat">
            <span className="mono">&lt;2m</span>
            <small>Find Your Stack</small>
          </div>
        </div>
      </div>

      <div className="hero-visual" style={{ animation: 'fadeSlideUp .8s ease-out .2s both' }}>
        <div className="hero-card card-hover" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="card-scanline" />
          <div className="card-icon">🎯</div>
          <h3 className="display">Personalized Picks</h3>
          <p>Get recommendations tuned to your role, budget, and workflow in seconds.</p>
        </div>
        <div className="hero-card card-hover" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="card-scanline" />
          <div className="card-icon">📊</div>
          <h3 className="display">Trust Signals</h3>
          <p>Compare ratings, use cases, and strengths before committing to a tool.</p>
        </div>
        <div className="hero-card hero-card-wide card-hover" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="card-scanline" />
          <div className="card-icon">🧩</div>
          <h3 className="display">Stack Builder</h3>
          <p>Build a complete AI stack by combining generation, coding, search, and automation tools with confidence.</p>
          <div className="code-snippet mono">
            <span className="code-kw">const</span> topTools = allTools
            .<span className="code-fn">filter</span>(tool =&gt; tool.useCase === profile.useCase)<br/>
            .<span className="code-fn">sort</span>((a, b) =&gt; b.score - a.score)
            .<span className="code-fn">slice</span>(0, 5);
          </div>
        </div>
      </div>
    </section>
  );
}

function handleTilt(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
}

function resetTilt(e) {
  e.currentTarget.style.transform = '';
}
