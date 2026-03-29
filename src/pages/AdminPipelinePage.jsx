import './AdminPipelinePage.css';

const streamEvents = [
  { role: 'DISCOVERY_TASK_881', status: 'RUNNING', detail: 'INIT:09:42:11  TOOLS...' },
  { role: 'EVALUATION_BATCH_ALPHA', status: 'SUCCESS', detail: 'DONE_09:38:05  IOT_CLUSTER...' },
  { role: 'MONITORING_NODE_EX', status: 'FAILED', detail: 'FAIL_09:35:55  PROTOCOL...' },
];

export default function AdminPipelinePage() {
  return (
    <section className="admin-pipeline-page-neo">
      <div className="admin-pipeline-shell">
        <header className="admin-pipeline-header">
          <h1>AI BRUTAL</h1>
          <span>STATUS_PANEL</span>
        </header>

        <div className="admin-health-card">
          <h2>SYSTEM HEALTH</h2>
          <div className="admin-health-grid">
            <div><small>UPTIME</small><strong>99.98%</strong></div>
            <div><small>THROUGHPUT</small><strong>1.2GB/s</strong></div>
            <div><small>LATENCY</small><strong>14ms</strong></div>
          </div>
        </div>

        <div className="admin-metrics-stack">
          <article><small>PIPELINE_RUNS</small><strong>4,209</strong><p>+12% LAST HOUR</p></article>
          <article className="ok"><small>SUCCESS_RATE</small><strong>98.4%</strong><p>STABLE ASYNC</p></article>
          <article className="warn"><small>ACTIVE_FAILURES</small><strong>03</strong><p>VIEW ERROR LOGS</p></article>
        </div>

        <div className="admin-live-stream">
          <h3>LIVE_PIPELINE_EXECUTION</h3>
          <ul>
            {streamEvents.map((event) => (
              <li key={event.role}>
                <div>
                  <strong>{event.role}</strong>
                  <p>{event.detail}</p>
                </div>
                <span className={`status ${event.status.toLowerCase()}`}>{event.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
