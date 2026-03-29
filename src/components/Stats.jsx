import { useRef, useEffect, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import './Stats.css';

const stats = [
  { target: 10, suffix: 'B+', label: 'Parameters Trained', bg: 'var(--purple)', color: 'var(--white)' },
  { target: 99, suffix: '.7%', label: 'Model Accuracy', bg: 'var(--pink)' },
  { target: 500, suffix: 'K+', label: 'API Calls / Sec', bg: 'var(--blue)' },
  { target: 50, suffix: 'ms', label: 'Avg Latency', bg: 'var(--yellow)' },
];

export default function Stats() {
  return (
    <section className="stats">
      {stats.map((s, i) => (
        <StatItem key={i} stat={s} index={i} />
      ))}
    </section>
  );
}

function StatItem({ stat, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(stat.target, visible);

  return (
    <div
      className={`stat-item ${visible ? 'stat-item--visible' : ''}`}
      ref={ref}
      style={{
        background: stat.bg,
        color: stat.color || 'var(--black)',
        animationDelay: `${index * 100}ms`,
      }}
    >
      <span className="stat-number mono">
        {visible ? `${count}${stat.suffix}` : `0${stat.suffix}`}
      </span>
      <div className="stat-label mono">{stat.label}</div>
    </div>
  );
}
