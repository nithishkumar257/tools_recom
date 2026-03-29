import Features from '../components/Features';
import BentoGrid from '../components/BentoGrid';
import Stats from '../components/Stats';
import Marquee from '../components/Marquee';
import { aiTools, categories } from '../data/aiTools';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero intro */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <p className="about-eyebrow mono">ABOUT RECOMMENDEX</p>
          <h1 className="display">
            Your go-to directory for the <span className="highlight">best AI tools</span>
          </h1>
          <p className="about-hero-desc">
            RecommenDex is a curated AI tool discovery platform. We track, score, and compare
            {' '}{aiTools.length}+ AI tools across {categories.length} categories — helping
            developers, creators, and teams find the right tool for every workflow.
            No fluff, just real data and honest ratings.
          </p>

          <div className="about-values">
            <div className="about-value-card card-hover">
              <div className="about-value-icon">📊</div>
              <h3 className="display">Real-Time Scores</h3>
              <p>Every tool is rated on accuracy, speed, ease of use, and value — updated continuously as tools evolve.</p>
            </div>
            <div className="about-value-card card-hover">
              <div className="about-value-icon">🔍</div>
              <h3 className="display">Honest Reviews</h3>
              <p>Pros, cons, and feature breakdowns for each tool. No sponsored rankings — just transparent comparisons.</p>
            </div>
            <div className="about-value-card card-hover">
              <div className="about-value-icon">🚀</div>
              <h3 className="display">Always Current</h3>
              <p>Version tracking, update history, and trending indicators so you always know what's new and relevant.</p>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Reuse Features & Stats */}
      <Features />
      <Stats />

      {/* Mission block */}
      <section className="about-mission">
        <div className="about-mission-inner">
          <div className="about-mission-content">
            <p className="about-eyebrow mono">OUR MISSION</p>
            <h2 className="display">
              Make AI tool discovery <span className="highlight">effortless</span>
            </h2>
            <p>
              The AI landscape moves fast — new tools launch daily, existing ones ship major updates,
              and pricing models change overnight. RecommenDex exists to cut through the noise.
              We aggregate performance data, track version histories, and surface trending tools
              so you can make informed decisions without hours of research.
            </p>
          </div>
          <div className="about-mission-visual">
            <div className="mission-code mono">
              <div className="mission-code-dots">●●●</div>
              <pre>
              {`$ recommendex stats
✓ Tools tracked:    ${aiTools.length}+
✓ Categories:       ${categories.length}
✓ Score dimensions: 4
  — Accuracy, Speed, Ease, Value
✓ Updated:          Continuously
✓ Pricing covered:  Free → Enterprise

> Explore at /tools`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="about-team">
        <div className="about-team-inner">
          <p className="about-eyebrow mono">HOW IT WORKS</p>
          <h2 className="display">
            Find the <span className="highlight">right tool</span> in seconds
          </h2>
          <div className="about-team-grid">
            {[
              { step: '01', title: 'Browse & Filter', desc: 'Explore tools by category, score, or trending status.', color: 'var(--purple)' },
              { step: '02', title: 'Compare Scores', desc: 'See accuracy, speed, ease, and value breakdowns at a glance.', color: 'var(--pink)' },
              { step: '03', title: 'Read Details', desc: 'Check features, pros, cons, version history, and user base.', color: 'var(--blue)' },
              { step: '04', title: 'Save & Track', desc: 'Bookmark favorites and get updates when tools ship new versions.', color: 'var(--lime)' },
            ].map((item) => (
              <div className="team-card card-hover" key={item.step}>
                <div
                  className="team-avatar display"
                  style={{ background: item.color }}
                >
                  {item.step}
                </div>
                <h4 className="display">{item.title}</h4>
                <p className="mono">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
