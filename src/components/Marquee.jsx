import './Marquee.css';

const items = [
  'NEURAL NETWORKS', '✦', 'MACHINE LEARNING', '✦',
  'DEEP LEARNING', '✦', 'COMPUTER VISION', '✦',
  'NLP MODELS', '✦', 'GENERATIVE AI', '✦',
  'TRANSFORMER', '✦', 'REINFORCEMENT LEARNING', '✦',
];

const items2 = [
  'EDGE COMPUTING', '◆', 'ROBOTICS', '◆',
  'AI SAFETY', '◆', 'MULTIMODAL', '◆',
  'FINE-TUNING', '◆', 'INFERENCE', '◆',
  'EMBEDDINGS', '◆', 'RAG PIPELINE', '◆',
];

export default function Marquee() {
  const doubled = [...items, ...items];
  const doubled2 = [...items2, ...items2];
  return (
    <div className="marquee-wrapper">
      <div className="marquee">
        {doubled.map((text, i) => (
          <span key={i} className="mono">{text}</span>
        ))}
      </div>
      <div className="marquee marquee--reverse">
        {doubled2.map((text, i) => (
          <span key={i} className="mono">{text}</span>
        ))}
      </div>
    </div>
  );
}
