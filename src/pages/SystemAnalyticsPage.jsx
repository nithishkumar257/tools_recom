import './SystemAnalyticsPage.css';

const logs = [
  '[11:22:01] NODE_04 ACCESS GRANTED. SYNCING CORE_LOGIC.',
  '[11:22:07] MANUAL_OVERRIDE RECEIVED: TICKET A902.',
  '[11:22:15] NODE_02 REPORT SUCCESSFUL. VERSION 1.0 LOADED.',
  '[11:22:29] SYNC_BARRIER RE-ALIGNING GLOBAL CLOCK.',
];

export default function SystemAnalyticsPage() {
  return (
    <section className="system-analytics-page-neo">
      <div className="system-analytics-shell">
        <header className="analytics-header-neo">
          <p>REAL-TIME OPERATIONS</p>
          <h1>SYSTEM ANALYTICS</h1>
        </header>

        <article className="analytics-hero-card">
          <div>
            <small>GLOBAL THROUGHPUT</small>
            <strong>14.2</strong>
            <span>+2.4% CRITICAL OFFSET</span>
          </div>
          <button>MANUAL TUNE</button>
        </article>

        <article className="analytics-latency-card">
          <h2>INFERENCE LATENCY</h2>
          <p><span>MEAN</span><strong>12ms</strong></p>
          <p><span>P99 PEAK</span><strong>44ms</strong></p>
        </article>

        <article className="analytics-logs-card">
          <h2>SYSTEM LOGS</h2>
          <ul>
            {logs.map((entry) => <li key={entry}>{entry}</li>)}
          </ul>
        </article>
      </div>
    </section>
  );
}
