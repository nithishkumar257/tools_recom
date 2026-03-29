import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import './PasswordResetPage.css';

export default function PasswordResetPage() {
  const [identity, setIdentity] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    if (!identity.trim()) {
      setError('Identity string is required.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(identity.trim(), {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (resetError) throw resetError;
      }

      setStatus('Reset code emitted. Check your inbox for the secure recovery sequence.');
    } catch (apiError) {
      setError(apiError?.message || 'Unable to emit reset code right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="reset-page-neo">
      <header className="reset-topbar">
        <Link to="/auth" className="reset-back-link">← RETURN_TO_AUTH</Link>
        <span className="reset-live">SYSTEM_LIVE</span>
      </header>

      <div className="reset-card">
        <h1>RESET_ACCESS</h1>
        <p>
          Input the primary identity string associated with your node to initiate a
          secure recovery sequence.
        </p>

        <form className="reset-form" onSubmit={handleReset}>
          <label htmlFor="identity">IDENTITY_STRING</label>
          <input
            id="identity"
            type="email"
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
            placeholder="USER@NETWORK_NODE.IO"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'PROCESSING...' : 'EMIT_RESET_CODE'}
          </button>
        </form>

        {status && <p className="reset-status">{status}</p>}
        {error && <p className="reset-error">{error}</p>}

        <div className="reset-links">
          <Link to="/auth">BACK_TO_LOGIN</Link>
          <a href="mailto:hello@aibrutal.dev">TECHNICAL_SUPPORT</a>
        </div>
      </div>
    </section>
  );
}
