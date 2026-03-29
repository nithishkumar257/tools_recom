import { useState } from 'react';
import { FiLogIn, FiUserPlus, FiLogOut, FiShield } from 'react-icons/fi';
import { isSupabaseConfigured, supabase, getProfile } from '../lib/supabaseClient';
import './AuthPanel.css';

export default function AuthPanel({ session, onAuthState }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setStatus('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    setStatus('');

    const action =
      mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;

    if (error) {
      setStatus(error.message);
    } else {
      setStatus(mode === 'login' ? 'Logged in successfully. Redirecting to dashboard...' : 'Sign-up successful. Check your email confirmation settings.');
      // Ensure a profile row exists for the user
      if (mode === 'login') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) getProfile(session.user.id).catch(() => {});
      }
      onAuthState?.();
      if (mode === 'login') {
        setTimeout(() => {
          window.location.assign('/dashboard');
        }, 1200);
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setStatus('Logged out.');
    onAuthState?.();
  };

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    setStatus('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setStatus(error.message || 'Google sign-in failed. Please try again.');
    }

    setLoading(false);
  };

  if (session) {
    return (
      <div className="auth-shell">
        <div className="auth-head">
          <FiShield />
          <span>Authenticated</span>
        </div>
        <p className="auth-user">{session.user.email}</p>
        <p className="auth-accuracy-note">High-accuracy recommendations and live comparison are unlocked.</p>
        <button type="button" className="auth-btn ghost" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-mode-toggle">
        <button
          type="button"
          className={`auth-toggle ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`auth-toggle ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => setMode('signup')}
        >
          Sign Up
        </button>
      </div>

      <button type="button" className="auth-btn auth-google-btn" disabled={loading} onClick={handleGoogleAuth}>
        <span className="google-mark">G</span>
        <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
      </button>

      <div className="auth-separator">
        <span>or continue with email</span>
      </div>

      <form className="auth-form" onSubmit={handleAuth}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            minLength={6}
            required
          />
        </label>
        <button type="submit" className="auth-btn" disabled={loading}>
          {mode === 'login' ? <FiLogIn /> : <FiUserPlus />}
          <span>{loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create account'}</span>
        </button>
      </form>

      {status && <p className="auth-status">{status}</p>}
      <p className="auth-accuracy-note">
        Sign in to enable high-accuracy AI recommendations, smarter comparison insights, and saved decision history.
      </p>
      {!isSupabaseConfigured && (
        <p className="auth-warning">
          Supabase keys missing. Add env vars to enable authentication.
        </p>
      )}
    </div>
  );
}
