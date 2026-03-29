import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page-neo">
      {/* Hero Section */}
      <section className="neo-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>SYSTEM_LIVE</span>
            </div>

            <h1 className="neo-title">
              Discover<br />
              <span className="text-primary">AI Tools</span>
            </h1>

            <p className="neo-subtitle">
              Find the best AI tools for your exact workflow. Explore trusted picks, 
              compare strengths, and build your complete stack in minutes.
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">8K+</div>
                <div className="stat-label">Tools Indexed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">300+</div>
                <div className="stat-label">Use Cases</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">95%</div>
                <div className="stat-label">Match Score</div>
              </div>
            </div>

            <div className="hero-actions">
              <button 
                onClick={() => navigate('/tools')} 
                className="btn btn-primary btn-lg"
              >
                <span>🔍</span> Explore Tools
              </button>
              <button 
                onClick={() => navigate('/stack')} 
                className="btn btn-secondary btn-lg"
              >
                <span>🧩</span> Build Stack
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hero-visual">
            <div className="visual-grid">
              <div className="visual-item"></div>
              <div className="visual-item"></div>
              <div className="visual-item"></div>
              <div className="visual-item"></div>
              <div className="visual-item highlight"></div>
              <div className="visual-item"></div>
            </div>
            <div className="visual-accent"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="neo-features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why AI_BRUTAL</h2>
            <p className="section-subtitle">Comprehensive AI tool discovery platform</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Personalized</h3>
              <p>Get recommendations tailored to your specific workflow and requirements.</p>
              <div className="feature-accent"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast Compare</h3>
              <p>Side-by-side comparison of features, pricing, and performance metrics.</p>
              <div className="feature-accent"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data Driven</h3>
              <p>Ratings, reviews, and metrics from thousands of real users.</p>
              <div className="feature-accent"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Integration Ready</h3>
              <p>Learn how tools integrate with your existing tech stack.</p>
              <div className="feature-accent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Tools Section */}
      <section className="neo-tools">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Tools</h2>
            <button 
              onClick={() => navigate('/tools')} 
              className="btn btn-ghost"
            >
              View All →
            </button>
          </div>

          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-header">
                <span className="tool-icon">🤖</span>
                <span className="tool-badge">Popular</span>
              </div>
              <h3>ChatGPT</h3>
              <p>Advanced reasoning, writing, and code generation capabilities.</p>
              <div className="tool-meta">
                <span className="badge-secondary">Reasoning</span>
                <span className="badge-secondary">Writing</span>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-header">
                <span className="tool-icon">🧠</span>
                <span className="tool-badge">Trending</span>
              </div>
              <h3>Claude 3.5</h3>
              <p>High-fidelity intelligence for complex architectural tasks.</p>
              <div className="tool-meta">
                <span className="badge-secondary">Analysis</span>
                <span className="badge-secondary">Code</span>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-header">
                <span className="tool-icon">⚙️</span>
                <span className="tool-badge">Newest</span>
              </div>
              <h3>Perplexity</h3>
              <p>Advanced web research and real-time information synthesis.</p>
              <div className="tool-meta">
                <span className="badge-secondary">Research</span>
                <span className="badge-secondary">Web</span>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-header">
                <span className="tool-icon">🎨</span>
                <span className="tool-badge">Creative</span>
              </div>
              <h3>Midjourney</h3>
              <p>Text-to-image generation with advanced creative control.</p>
              <div className="tool-meta">
                <span className="badge-secondary">Images</span>
                <span className="badge-secondary">Creative</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="neo-cta">
        <div className="container">
          <div className="cta-content">
            <div className="cta-badge">READY TO START?</div>
            <h2>Build Your AI Stack Today</h2>
            <p>Choose from thousands of tools or get personalized recommendations based on your needs.</p>
            <div className="cta-actions">
              <button 
                onClick={() => navigate('/tools')} 
                className="btn btn-primary btn-lg"
              >
                <span>📚</span> Explore All Tools
              </button>
              <button 
                onClick={() => navigate('/stack')} 
                className="btn btn-secondary btn-lg"
              >
                <span>🔨</span> Smart Builder
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
