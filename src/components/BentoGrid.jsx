import { useInView } from '../hooks/useIntersectionObserver';
import './BentoGrid.css';

const items = [
  {
    icon: '🤖',
    title: 'Custom LLMs',
    desc: 'Fine-tune large language models on your proprietary data. Private, secure, and hyper-relevant to your domain.',
    span: 2,
    bg: 'var(--purple)',
    color: 'var(--white)',
    tag: 'MOST POPULAR',
  },
  {
    icon: '👁️',
    title: 'Computer Vision',
    desc: 'Object detection, segmentation, and image generation — all production-ready.',
    bg: 'var(--yellow)',
  },
  {
    icon: '🗣️',
    title: 'NLP Pipeline',
    desc: 'Sentiment analysis, entity extraction, classification — at enterprise scale.',
    bg: 'var(--white)',
  },
  {
    icon: '📊',
    title: 'Predictive Analytics',
    desc: 'Time-series forecasting and anomaly detection that sees around corners.',
    bg: 'var(--pink)',
  },
  {
    icon: '🧪',
    title: 'AI Research Lab',
    desc: 'We push boundaries with experimental architectures, multi-modal models, and creative AI that challenges what machines can do.',
    span: 2,
    bg: 'var(--blue)',
    tag: 'EXPERIMENTAL',
  },
  {
    icon: '🔗',
    title: 'API Gateway',
    desc: 'One API, every model. Unified inference endpoints with auto-scaling.',
    bg: 'var(--orange)',
  },
];

export default function BentoGrid() {
  return (
    <section className="bento" id="services">
      <div className="section-header">
        <p className="bento-eyebrow mono">WHAT WE BUILD</p>
        <h2 className="display">AI <span className="highlight">services</span> we ship</h2>
      </div>
      <div className="bento-grid">
        {items.map((item, i) => (
          <BentoItem key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

function BentoItem({ item, index }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={`bento-item card-hover ${isVisible ? 'visible' : ''}`}
      style={{
        gridColumn: item.span ? `span ${item.span}` : undefined,
        background: item.bg,
        color: item.color || 'var(--black)',
        animationDelay: `${index * 80}ms`,
      }}
    >
      {item.tag && <span className="bento-tag mono">{item.tag}</span>}
      <div className="bento-icon">{item.icon}</div>
      <h3 className="display">{item.title}</h3>
      <p>{item.desc}</p>
      <div className="bento-arrow">→</div>
    </div>
  );
}
