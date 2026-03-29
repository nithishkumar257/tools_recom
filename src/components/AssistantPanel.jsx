import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSend, FiCompass, FiGitBranch, FiDollarSign } from 'react-icons/fi';
import { fetchRecommendationStack } from '../lib/apiClient';
import ToolCard from './ToolCard';
import './AssistantPanel.css';

export default function AssistantPanel({ category, session, context }) {
  const [requirement, setRequirement] = useState('I am a beginner and need help writing social media content quickly');
  const [submittedRequirement, setSubmittedRequirement] = useState(requirement);
  const [budgetMode, setBudgetMode] = useState('mixed');
  const [recommendations, setRecommendations] = useState([]);
  const [workflow, setWorkflow] = useState({ steps: [], budgetMode: 'mixed' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rationale, setRationale] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});

  const loadRecommendations = useCallback(async (answers = {}) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetchRecommendationStack({
        query: submittedRequirement,
        budget: budgetMode,
        category,
        follow_up_answers: answers,
      });

      setRecommendations((response.recommendations || []).slice(0, 4));
      setWorkflow(response.workflow || { steps: [], budgetMode });
      setRationale(response.rationale || null);
      setFollowUpQuestions(response?.follow_up?.questions || []);
      setFollowUpAnswers(response?.follow_up?.answers || {});
    } catch {
      setError('Unable to fetch recommendations from API.');
      setRecommendations([]);
      setWorkflow({ steps: [], budgetMode });
      setRationale(null);
      setFollowUpQuestions([]);
      setFollowUpAnswers({});
    } finally {
      setIsLoading(false);
    }
  }, [budgetMode, category, submittedRequirement]);

  useEffect(() => {
    loadRecommendations({});
  }, [loadRecommendations]);

  const paidRecommendationsWithAlternatives = useMemo(() => {
    return recommendations
      .filter((tool) => tool.freeAlternative)
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        alternative: tool.freeAlternative,
      }));
  }, [recommendations]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFollowUpAnswers({});
    setSubmittedRequirement(requirement);
  };

  const handleFollowUpChange = (questionId, value) => {
    setFollowUpAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const applyFollowUpRefinement = () => {
    loadRecommendations(followUpAnswers);
  };

  return (
    <section className="assistant-panel">
      <header>
        <h2><FiCompass /> Recommendation Assistant</h2>
        <p>
          Describe your requirement in plain language. The assistant ranks practical, real-world AI tools and links you to each official site.
        </p>
      </header>

      <form className="assistant-form" onSubmit={handleSubmit}>
        <label htmlFor="req">Your requirement</label>
        <textarea
          id="req"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder="Example: I need an AI tool to help with coding interviews and debugging in VS Code"
          rows={4}
        />

        <label htmlFor="budget">Budget mode</label>
        <div className="assistant-budget-row">
          <FiDollarSign size={14} />
          <select
            id="budget"
            value={budgetMode}
            onChange={(e) => setBudgetMode(e.target.value)}
            className="assistant-select"
          >
            <option value="free">Free Only</option>
            <option value="mixed">Mixed (Free + Paid)</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <button type="submit" className="assistant-btn">
          <FiSend />
          <span>Recommend tools</span>
        </button>
      </form>

      <div className="assistant-note">
        <strong>Logged in user:</strong> {session?.user?.email || 'Guest mode'}
      </div>

      {context && (
        <div className="assistant-context">
          <h3>Current page filters</h3>
          <ul>
            <li><strong>Search:</strong> {context.searchQuery || 'Any'}</li>
            <li><strong>Pricing:</strong> {context.pricingFilter}</li>
            <li><strong>Platform:</strong> {context.platformFilter}</li>
            <li><strong>Use case:</strong> {context.useCaseFilter}</li>
            <li><strong>Min score:</strong> {context.minimumScore}</li>
            <li><strong>Trending only:</strong> {context.trendingOnly ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      )}

      {workflow.steps.length > 0 && (
        <div className="assistant-workflow">
          <h3><FiGitBranch /> Suggested Workflow ({workflow.budgetMode})</h3>
          <ul>
            {workflow.steps.map((step) => (
              <li key={`${step.role}-${step.primary?.id}`}>
                <strong>{step.role}:</strong> {step.primary?.name}
                {step.alternative ? ` (alt: ${step.alternative.name})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rationale && (
        <div className="assistant-rationale">
          <h3>Recommendation rationale</h3>
          <ul>
            <li>
              <strong>Inferred categories:</strong>{' '}
              {rationale.inferred_query_categories?.length
                ? rationale.inferred_query_categories.join(', ')
                : 'general'}
            </li>
            <li><strong>Avg compatibility:</strong> {rationale.average_compatibility_score}</li>
            <li>
              <strong>Budget fit:</strong>{' '}
              strong {rationale.budget_fit_summary?.strong ?? 0} ·
              medium {rationale.budget_fit_summary?.medium ?? 0} ·
              weak {rationale.budget_fit_summary?.weak ?? 0}
            </li>
          </ul>
        </div>
      )}

      {followUpQuestions.length > 0 && (
        <div className="assistant-followup">
          <h3>Follow-up questions</h3>
          <p className="mono">Refine recommendations with additional preferences.</p>
          <div className="assistant-followup-questions">
            {followUpQuestions.map((question) => (
              <label key={question.id} className="assistant-followup-question">
                <span>{question.prompt}</span>
                <select
                  value={followUpAnswers[question.id] || ''}
                  onChange={(event) => handleFollowUpChange(question.id, event.target.value)}
                >
                  <option value="">Select…</option>
                  {(question.options || []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button type="button" className="assistant-btn" onClick={applyFollowUpRefinement}>
            <FiSend />
            <span>Apply follow-up answers</span>
          </button>
        </div>
      )}

      {paidRecommendationsWithAlternatives.length > 0 && (
        <div className="assistant-alternatives">
          <h3>Free alternatives for paid picks</h3>
          <ul>
            {paidRecommendationsWithAlternatives.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> → {item.alternative.name} ({item.alternative.pricing})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="assistant-results">
        {isLoading && <p>Loading recommendations...</p>}
        {error && <p>{error}</p>}
        {recommendations.map((tool) => (
          <div key={`rec-${tool.id}`} className="assistant-rec-wrap">
            <ToolCard tool={tool} compact />
            {(tool.reasoning || []).length > 0 && (
              <ul className="assistant-rec-reasons">
                {tool.reasoning.map((reason, index) => (
                  <li key={`${tool.id}-reason-${index}`}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
