import { useState } from 'react';
import './ToolSubmissionPage.css';

export default function ToolSubmissionPage() {
  const [form, setForm] = useState({
    name: '',
    url: '',
    category: 'AI / ML',
    reason: '',
    accepted: false,
  });
  const [status, setStatus] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.accepted) {
      setStatus('You must accept digital monolith protocols before submission.');
      return;
    }
    setStatus('INITIALIZE_SUBMISSION_ complete. Pending security scan and reviewer sync.');
  };

  return (
    <section className="tool-submit-page-neo">
      <div className="tool-submit-shell">
        <header className="tool-submit-header">
          <p>INDUSTRIAL INTAKE</p>
          <h1>FORGE YOUR LEGACY.</h1>
          <p>
            Submit your tool to the grid. High-utility digital primitives only.
            Minimal aesthetic compliance required.
          </p>
          <div className="tool-submit-feature-strip">
            <span>FAST PROCESSING</span>
            <span>HIGH VISIBILITY</span>
          </div>
          <div className="tool-submit-visual" aria-hidden="true" />
        </header>

        <form className="tool-submit-form" onSubmit={handleSubmit}>
          <label>
            01. TOOL NAME
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="E.G. QUANTUM_PROCESSOR" required />
          </label>

          <label>
            02. WEBSITE URL
            <input value={form.url} onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))} placeholder="HTTPS://TOOL.IO" required />
          </label>

          <label>
            03. INDUSTRIAL CATEGORY
            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
              <option>AI / ML</option>
              <option>DEVELOPER</option>
              <option>DESIGN</option>
              <option>UTILITY</option>
            </select>
          </label>

          <label>
            04. WHY IT'S UNIQUE
            <textarea value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} placeholder="DESCRIBE THE CORE DIFFERENTIATOR..." rows={6} />
          </label>

          <label className="checkbox">
            <input type="checkbox" checked={form.accepted} onChange={(event) => setForm((prev) => ({ ...prev, accepted: event.target.checked }))} />
            I AGREE TO THE DIGITAL MONOLITH PROTOCOLS
          </label>

          <button type="submit">INITIALIZE_SUBMISSION_</button>
        </form>

        {status && <p className="submit-status">{status}</p>}

        <aside className="tool-submit-side-notes">
          <article>
            <strong>SECURITY CHECK</strong>
            <p>All URLs are scanned for vulnerabilities before publishing.</p>
          </article>
          <article>
            <strong>LEGAL PROTOCOL</strong>
            <p>Submissions must comply with industrial-grade standards.</p>
          </article>
        </aside>
      </div>
    </section>
  );
}
