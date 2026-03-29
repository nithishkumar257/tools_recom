import { useMemo } from 'react';
import { FiMessageSquare, FiThumbsUp, FiStar } from 'react-icons/fi';
import { aiTools } from '../data/aiTools';
import './CommunityFeedPage.css';

export default function CommunityFeedPage() {
  const featuredReports = useMemo(() => {
    return aiTools
      .filter((tool) => tool.trending)
      .slice(0, 4)
      .map((tool, index) => ({
        id: tool.id,
        title: `${tool.name.toUpperCase().replace(/\s+/g, '_')}_V2.${index + 1}`,
        handle: `@${(tool.developer || 'SYSTEM_ARCHITECT').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        note: tool.description,
        votes: 50 + index * 34,
        comments: 2 + index * 4,
      }));
  }, []);

  return (
    <section className="community-page-neo">
      <header className="community-header">
        <h1>TRENDING_CONVERSATIONS</h1>
        <div className="community-active">
          <span>ACTIVE_NOW</span>
          <small>2.4K PARTICIPANTS</small>
        </div>
      </header>

      <article className="community-stream-highlight">
        <h2>THE_LLM_INFRA_MONOLITH</h2>
        <p>
          Discussing the shift from monolithic architectures to agentic mesh networks.
          Live feedback on v4.2 implementation.
        </p>
      </article>

      <section className="community-reports">
        <h3>FIELD_REPORTS</h3>
        <div className="community-cards">
          {featuredReports.map((report) => (
            <article key={report.id} className="community-card">
              <div className="community-card-head">
                <h4>{report.title}</h4>
                <span><FiStar /> HOT</span>
              </div>
              <p className="community-handle">{report.handle}</p>
              <blockquote>{report.note}</blockquote>
              <div className="community-meta">
                <span><FiThumbsUp /> {report.votes} votes</span>
                <span><FiMessageSquare /> {report.comments} comments</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
