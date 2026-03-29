import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Navbar.css';

export default function Navbar({ session }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      setMenuOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new FormData(e.target).get('search');
    if (query.trim()) {
      navigate(`/tools?search=${encodeURIComponent(query)}`);
    }
  };


  return (
    <header className="neo-header">
      <div className="neo-header-inner">
        {/* Brand */}
        <Link to="/" className="neo-brand">
          <span className="neo-terminal-icon">⊞</span>
          <span className="neo-brand-text">AI_BRUTAL</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="neo-nav hide-mobile">
          <Link
            to="/tools"
            className={`neo-nav-link ${isActive('/tools') ? 'active' : ''}`}
          >
            <span>🔍</span>
            <span>DISCOVER</span>
          </Link>
          <Link
            to="/categories"
            className={`neo-nav-link ${isActive('/categories') ? 'active' : ''}`}
          >
            <span>🧱</span>
            <span>LAYERS</span>
          </Link>
          <Link
            to="/compare"
            className={`neo-nav-link ${isActive('/compare') ? 'active' : ''}`}
          >
            <span>⚖️</span>
            <span>COMPARE</span>
          </Link>
          <Link
            to="/stack"
            className={`neo-nav-link ${isActive('/stack') ? 'active' : ''}`}
          >
            <span>🧩</span>
            <span>BUILD</span>
          </Link>
          <Link
            to="/collections"
            className={`neo-nav-link ${isActive('/collections') ? 'active' : ''}`}
          >
            <span>📌</span>
            <span>SAVED</span>
          </Link>
          <Link
            to="/community"
            className={`neo-nav-link ${isActive('/community') ? 'active' : ''}`}
          >
            <span>💬</span>
            <span>COMMUNITY</span>
          </Link>
          <Link
            to="/pipeline"
            className={`neo-nav-link ${isActive('/pipeline') ? 'active' : ''}`}
          >
            <span>📡</span>
            <span>PIPELINE</span>
          </Link>
          <Link
            to="/analytics"
            className={`neo-nav-link ${isActive('/analytics') ? 'active' : ''}`}
          >
            <span>📈</span>
            <span>ANALYTICS</span>
          </Link>
        </nav>

        {/* Actions */}
        <div className="neo-header-actions">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="neo-search-form hide-mobile">
            <input
              type="search"
              name="search"
              placeholder="search tools"
              className="input"
              aria-label="Search tools"
            />
          </form>

          {session ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost hide-mobile">
                Dashboard
              </Link>
              <Link to="/settings" className="btn btn-ghost hide-mobile">
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline hide-mobile"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary hide-mobile">
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="neo-mobile-menu-toggle hide-desktop"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={menuOpen ? 'active' : ''}></span>
            <span className={menuOpen ? 'active' : ''}></span>
            <span className={menuOpen ? 'active' : ''}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="neo-mobile-menu hide-desktop">
          <form onSubmit={handleSearch} className="neo-mobile-search">
            <input
              type="search"
              name="search"
              placeholder="search tools"
              className="input"
              aria-label="Search tools"
            />
          </form>
          <Link
            to="/tools"
            className={`neo-mobile-menu-link ${isActive('/tools') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>🔍</span>
            <span>Discover</span>
          </Link>
          <Link
            to="/compare"
            className={`neo-mobile-menu-link ${isActive('/compare') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>⚖️</span>
            <span>Compare</span>
          </Link>
          <Link
            to="/stack"
            className={`neo-mobile-menu-link ${isActive('/stack') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>🧩</span>
            <span>BuildStack</span>
          </Link>
          <Link
            to="/collections"
            className={`neo-mobile-menu-link ${isActive('/collections') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>📌</span>
            <span>Saved</span>
          </Link>
          <Link
            to="/community"
            className={`neo-mobile-menu-link ${isActive('/community') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>💬</span>
            <span>Community</span>
          </Link>
          <Link
            to="/submit"
            className={`neo-mobile-menu-link ${isActive('/submit') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>🛠️</span>
            <span>Submit Tool</span>
          </Link>
          <Link
            to="/mode-switch"
            className={`neo-mobile-menu-link ${isActive('/mode-switch') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>🧠</span>
            <span>Mode Switch</span>
          </Link>
          <div className="neo-mobile-menu-divider"></div>
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="neo-mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                <span>📊</span>
                <span>Dashboard</span>
              </Link>
              <Link
                to="/settings"
                className="neo-mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                <span>👤</span>
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="neo-mobile-menu-link"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="neo-mobile-menu-link btn btn-primary"
              onClick={() => setMenuOpen(false)}
            >
              <span>🔐</span>
              <span>Login</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
