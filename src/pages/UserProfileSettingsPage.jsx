import { useState } from 'react';
import './UserProfileSettingsPage.css';

export default function UserProfileSettingsPage() {
  const [budgetMode, setBudgetMode] = useState('mixed');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [techPrimary, setTechPrimary] = useState('js');
  const [feedA, setFeedA] = useState(true);
  const [feedB, setFeedB] = useState(false);
  const [feedC, setFeedC] = useState(true);

  return (
    <section className="profile-settings-page-neo">
      <div className="profile-settings-shell">
        <section className="profile-summary-card">
          <div className="profile-summary-avatar" aria-hidden="true" />
          <h2>USER_0X7F</h2>
          <p>PREMIUM_NODE</p>
          <div className="profile-summary-stats">
            <span>UPTIME <strong>99.98%</strong></span>
            <span>CREDITS <strong>12,450_NEO</strong></span>
          </div>
          <div className="profile-summary-tabs">
            <button type="button" className="active">CORE_PREFERENCES</button>
            <button type="button">SECURITY_LOCK</button>
            <button type="button">DATA_FEEDS</button>
          </div>
        </section>

        <header className="profile-settings-header">
          <h1>CONFIG_STATE</h1>
          <p>Adjust node behavior, preference weights, and feed logic rules.</p>
        </header>

        <div className="settings-grid">
          <article className="settings-card">
            <h2>BUDGET_MODE</h2>
            <div className="settings-options">
              {['free', 'mixed', 'premium'].map((option) => (
                <button
                  key={option}
                  className={budgetMode === option ? 'active' : ''}
                  onClick={() => setBudgetMode(option)}
                >
                  {option.toUpperCase()}_ONLY
                </button>
              ))}
            </div>
          </article>

          <article className="settings-card">
            <h2>SKILL_THRESHOLD</h2>
            <div className="settings-options">
              {['beginner', 'intermediate', 'expert'].map((option) => (
                <button
                  key={option}
                  className={skillLevel === option ? 'active' : ''}
                  onClick={() => setSkillLevel(option)}
                >
                  {option.toUpperCase()}_MODE
                </button>
              ))}
            </div>
          </article>

          <article className="settings-card">
            <h2>TECH_STACK_PRIORITY</h2>
            <div className="settings-options two-col">
              {['js', 'python', 'go', 'rust'].map((option) => (
                <button
                  key={option}
                  className={techPrimary === option ? 'active' : ''}
                  onClick={() => setTechPrimary(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </article>

          <article className="settings-card">
            <h2>FEED_LOGIC</h2>
            <label><input type="checkbox" checked={feedA} onChange={() => setFeedA((value) => !value)} /> ALGORITHMIC_BIAS</label>
            <label><input type="checkbox" checked={feedB} onChange={() => setFeedB((value) => !value)} /> NEURAL_DRAFTING</label>
            <label><input type="checkbox" checked={feedC} onChange={() => setFeedC((value) => !value)} /> VOID_MODE</label>
          </article>
        </div>

        <div className="settings-actions">
          <button className="ghost">RESET_CONFIG</button>
          <button className="primary">SYNC_CHANGES</button>
        </div>
      </div>
    </section>
  );
}
