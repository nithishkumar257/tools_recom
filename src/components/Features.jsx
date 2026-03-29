import { useInView } from '../hooks/useIntersectionObserver';
import './Features.css';

const features = [
  {
    num: '01',
    icon: '🎯',
    title: 'Smart Matching',
    desc: 'RecommenDex maps your role, budget, and goals to the best-fit tools with transparent scoring.',
    bg: 'var(--yellow)',
  },
  {
    num: '02',
    icon: '🔍',
    title: 'Deep Comparison',
    desc: 'Compare pricing, strengths, and limitations side-by-side so decisions are fast and confident.',
    bg: 'var(--white)',
  },
  {
    num: '03',
    icon: '⚡',
    title: 'Always Updated',
    desc: 'Track launches, version changes, and trending shifts across the AI ecosystem in real time.',
    bg: 'var(--pink)',
  },
  {
    num: '04',
    icon: '🛡️',
    title: 'Trust-First Ranking',
    desc: 'Rankings prioritize utility and reliability with clear rationale, not hype-driven popularity.',
    bg: 'var(--blue)',
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="section-header">
        <p className="features-eyebrow mono">WHY US</p>
        <h2 className="display">
          Why choose <span className="highlight">RecommenDex</span>?
        </h2>
      </div>
      {features.map((f, i) => (
        <FeatureCard key={i} feature={f} delay={i * 100} />
      ))}
    </section>
  );
}

function FeatureCard({ feature, delay }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={`feature-card card-hover ${isVisible ? 'visible' : ''}`}
      style={{
        background: feature.bg,
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="card-number display">{feature.num}</span>
      <div className="icon">{feature.icon}</div>
      <h3 className="display">{feature.title}</h3>
      <p>{feature.desc}</p>
      <div className="feature-line" />
    </div>
  );
}
