import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-neo">
      <div className="footer-container-neo">
        {/* Branding Section */}
        <div className="footer-section-neo">
          <h3 className="footer-brand-neo">AI_BRUTAL</h3>
          <p>
            Discover and compare the best AI tools for your workflow.
            AI_BRUTAL helps teams move faster with smarter tool decisions.
          </p>
          <div className="footer-social-neo">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social-link-neo" title="GitHub">GitHub</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-link-neo" title="Twitter">Twitter</a>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="footer-social-link-neo" title="Discord">Discord</a>
            <a href="mailto:hello@aibrutal.dev" className="footer-social-link-neo" title="Email">Email</a>
          </div>
        </div>

        {/* Product Links */}
        <div className="footer-section-neo">
          <h4 className="footer-section-title">PRODUCT</h4>
          <ul className="footer-nav-list">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/tools">Browse Tools</Link></li>
            <li><Link to="/compare">Compare Tools</Link></li>
            <li><Link to="/submit">Submit Tool</Link></li>
          </ul>
        </div>

        {/* Community */}
        <div className="footer-section-neo">
          <h4 className="footer-section-title">COMMUNITY</h4>
          <ul className="footer-nav-list">
            <li><Link to="/community">Community Feed</Link></li>
            <li><Link to="/collections">Collections</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/settings">Profile Settings</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-section-neo">
          <h4 className="footer-section-title">LEGAL</h4>
          <ul className="footer-nav-list">
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#ethics">AI Ethics</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="footer-divider-neo"></div>

      {/* Bottom Section */}
      <div className="footer-bottom-neo">
        <p className="footer-copyright">
          &copy; 2026 AI_BRUTAL. All rights reserved. Designed with <span className="highlight">NEO</span> for builders.
        </p>
        <p className="footer-credits">
          Built with React, Vite, and Supabase. Powered by Neo-Brutal design.
        </p>
      </div>
    </footer>
  );
}

