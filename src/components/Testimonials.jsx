import { useInView } from '../hooks/useIntersectionObserver';
import './Testimonials.css';

const testimonials = [
  {
    quote: '"RecommenDex cut our tool research time from days to minutes. The ranking clarity made vendor decisions dramatically easier."',
    author: 'Sarah Kim',
    role: 'CTO at DataForge',
    accent: 'var(--purple)',
  },
  {
    quote: '"We replaced scattered spreadsheets with RecommenDex comparisons. Tool quality improved while spend dropped quarter over quarter."',
    author: 'Marcus Obi',
    role: 'VP Engineering at ScaleAI',
    accent: 'var(--pink)',
  },
  {
    quote: '"Their explainable AI module changed everything. Regulators loved the transparency. Our board loved the design. Win-win."',
    author: 'Elena Voss',
    role: 'Head of AI at FinanceX',
    accent: 'var(--blue)',
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="testimonials-inner">
        <div className="section-header">
          <p className="testimonials-eyebrow mono">SOCIAL PROOF</p>
          <h2 className="display" style={{ color: 'var(--white)' }}>
            What builders <span className="highlight">say</span>
          </h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} data={t} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ data, delay }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={`testimonial-card card-hover ${isVisible ? 'visible' : ''}`}
      style={{
        '--card-accent': data.accent,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="stars">★★★★★</div>
      <blockquote>{data.quote}</blockquote>
      <div className="testimonial-footer">
        <div className="author-avatar mono">{data.author[0]}</div>
        <div>
          <div className="author mono">{data.author}</div>
          <div className="role">{data.role}</div>
        </div>
      </div>
    </div>
  );
}
