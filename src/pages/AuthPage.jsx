import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './AuthPage.css';

export default function AuthPage({ session }) {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.pathname.toLowerCase().includes('signup'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/signup')) setIsLogin(false);
    if (path.includes('/login') || path.includes('/auth')) setIsLogin(true);
  }, [location.pathname]);

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err) {
      setError(err.message || 'Google login failed');
    }
  };

  return (
    <div className="auth-page-neo">
      <div className="auth-container">
        {/* Left Side - Info */}
        <div className="auth-side auth-info-side hide-mobile">
          <div className="auth-info-content">
            <h2 className="auth-info-title">
              Build Your<br />
              <span className="text-primary">AI Stack</span>
            </h2>
            <p className="auth-info-subtitle">
              Access 8000+ AI tools with personalized recommendations powered by real user data.
            </p>
            <ul className="auth-benefits">
              <li><span>✓</span> Personalized recommendations</li>
              <li><span>✓</span> Tool comparisons & ratings</li>
              <li><span>✓</span> Custom stack builder</li>
              <li><span>✓</span> Community insights</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-side auth-form-side">
          <div className="auth-form-wrapper">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">
                {isLogin ? 'Login' : 'Sign Up'}
              </h1>
              <p className="auth-subtitle">
                {isLogin ? 'Enter your credentials' : 'Create your account'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="auth-form">
              {error && <div className="form-error-alert">{error}</div>}

              <div className="input-group">
                <label className="input-label">Identity String</label>
                <input
                  type="email"
                  className="input"
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Access Cipher</label>
                <input
                  type="password"
                  className="input"
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <Link to="/reset-access" className="auth-footer-link">Reset access</Link>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
              >
                {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Initialize User'}
                <span>→</span>
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="divider-line"></div>
              <span className="divider-text">External Link</span>
              <div className="divider-line"></div>
            </div>

            {/* OAuth */}
            <div className="auth-oauth">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn btn-outline btn-sm w-100"
              >
                <span>🔐</span> Google
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm w-100"
              >
                <span>⊞</span> GitHub
              </button>
            </div>

            {/* Toggle */}
            <div className="auth-toggle">
              <p className="auth-toggle-text">
                {isLogin ? "New Operator?" : "Already have an account?"}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const nextMode = !isLogin;
                    setIsLogin(nextMode);
                    setError('');
                    navigate(nextMode ? '/login' : '/signup');
                  }}
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="auth-footer">
              <a href="#" className="auth-footer-link">Terms</a>
              <span className="auth-footer-sep">•</span>
              <a href="#" className="auth-footer-link">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
