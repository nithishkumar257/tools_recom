import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/categories', label: 'Browse', icon: '🔍' },
    { path: '/community', label: 'Community', icon: '💬' },
    { path: '/stack', label: 'Build', icon: '🎯' },
    { path: '/analytics', label: 'Status', icon: '⚙️' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map(({ path, label, icon }) => (
          <button
            key={path}
            className={`bottom-nav-item ${isActive(path) ? 'active' : ''}`}
            onClick={() => navigate(path)}
            aria-label={label}
            title={label}
          >
            <span className="bottom-nav-icon">{icon}</span>
            <span className="bottom-nav-label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
