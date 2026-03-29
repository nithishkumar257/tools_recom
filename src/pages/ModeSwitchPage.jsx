import { Link } from 'react-router-dom';
import './ModeSwitchPage.css';

export default function ModeSwitchPage() {
  return (
    <section className="mode-switch-page-neo">
      <div className="mode-switch-shell">
        <header className="mode-switch-topbar">
          <h1>NEO_MONOLITH</h1>
          <span>ADMIN_MODE</span>
        </header>

        <article className="mode-switch-panel">
          <p className="mode-switch-led">SYSTEM STATUS: ACTIVE</p>
          <h2>
            ACCESSING
            <br />
            <em>MONOLITH ENGINE</em>
          </h2>

          <ul className="mode-switch-log">
            <li><span>08:42:11</span> INITIATING_SEQUENCE...</li>
            <li><span>08:42:12</span> VERIFYING_ENCRYPTED_KERNELS... <strong>[OK]</strong></li>
            <li><span>08:42:14</span> MAPPING_NODAL_PERIPHERALS... <strong>[READY]</strong></li>
            <li><span>08:42:15</span> AWAITING_MODE_SELECTION...</li>
          </ul>

          <div className="mode-switch-visual" aria-hidden="true" />

          <div className="mode-switch-actions">
            <small className="mode-switch-actions-label">SELECT OPERATIONAL MODE</small>
            <Link to="/admin" className="mode-btn mode-btn-primary">SWITCH TO ADMIN_MODE</Link>
            <p className="mode-switch-warning">
              WARNING: Admin mode grants full read/write permissions to core services.
              All actions are logged and immutable.
            </p>
            <Link to="/" className="mode-btn mode-btn-secondary">PUBLIC_INTERFACE</Link>
          </div>

          <div className="mode-switch-metrics">
            <div><small>UPTIME</small><strong>99.998%</strong></div>
            <div><small>LATENCY</small><strong>14MS</strong></div>
          </div>

          <footer className="mode-switch-footer">
            <span>AUTHORIZED_USER</span>
            <strong>ROOT_SUPER_USER</strong>
          </footer>
        </article>

        <nav className="mode-switch-bottom-nav" aria-label="Mode switch sections">
          <span>CORE</span>
          <span>NODES</span>
          <span>VAULT</span>
          <span className="active">UPLINK</span>
        </nav>
      </div>
    </section>
  );
}
