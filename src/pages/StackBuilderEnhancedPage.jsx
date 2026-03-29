import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiMic, FiSquare, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  parseUserInput,
  createDebouncedRecommender,
  formatRecommendationForUI,
  extractComparisonMatrix,
} from '../lib/enhancedRecommendationEngine';
import { fetchRecommendationStack } from '../lib/apiClient';
import { aiTools } from '../data/aiTools';
import { trackToolEvent, trackRecommendationFeedback } from '../lib/agentPerformanceService';
import './StackBuilderEnhancedPage.css';

/**
 * Enhanced Stack Builder with Real-Time Reactivity
 * 
 * Features:
 * - Real-time recommendation updates as user types
 * - Voice input support
 * - Intelligent input parsing
 * - Adaptive UI based on confidence level
 * - Compare button integration
 * - Full fallback support
 */
export default function StackBuilderEnhancedPage({ session }) {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(session?.user?.id);
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [userInput, setUserInput] = useState('');
  const [formattedResult, setFormattedResult] = useState(null);

  // Loading states
  const [isLoadingFromAPI, setIsLoadingFromAPI] = useState(false);
  const [isLoadingFromLocal, setIsLoadingFromLocal] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Source tracking
  const [recommendationSource, setRecommendationSource] = useState(null);

  // UI states
  const [expandedDetails, setExpandedDetails] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  const [voiceError, setVoiceError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState('');

  // Advanced options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customWeights, setCustomWeights] = useState({});
  const [maxRecommendations, setMaxRecommendations] = useState(6);

  // Refs
  const recognitionRef = useRef(null);
  const debouncedRecommenderRef = useRef(createDebouncedRecommender(500));

  const quickPrompts = useMemo(() => ([
    'I need free AI tools for coding and debugging as a beginner',
    'Best AI stack for social media content creation with low budget',
    'Enterprise-ready AI tools for secure team collaboration',
    'Fastest AI tools to automate repetitive business workflows',
  ]), []);

  const browserCapabilities = useMemo(() => {
    if (typeof window === 'undefined') {
      return { speechSupported: false, online: true };
    }

    return {
      speechSupported: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
      online: navigator.onLine,
    };
  }, []);

  const parsedIntent = useMemo(() => {
    if (!userInput.trim()) return null;
    return parseUserInput(userInput);
  }, [userInput]);

  const hasLowConfidence = parsedIntent && parsedIntent.confidence < 0.45;

  // ============================================================================
  // FALLBACK TO LOCAL ENGINE (declared before useEffect that calls it)
  // ============================================================================

  const fallbackToLocal = useCallback(() => {
    setIsLoadingFromLocal(true);

    // Use debounced local recommender for performance and better personalization
    debouncedRecommenderRef.current.recommend(
      userInput,
      aiTools,
      {
        maxItems: maxRecommendations,
        weightsOverride: customWeights,
      },
      (result) => {
        setRecommendationSource('local');
        setFormattedResult(formatRecommendationForUI(result));
        setIsLoadingFromLocal(false);
      }
    );
  }, [userInput, maxRecommendations, customWeights]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        setVoiceError(`Voice input error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const segment = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += segment;
          }
        }

        if (finalTranscript.trim()) {
          setUserInput(prev => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ============================================================================
  // REAL-TIME REACTIVITY: Parse & Recommend on Input Change
  // ============================================================================

  useEffect(() => {
    if (!userInput.trim()) {
      return;
    }

    const intent = parsedIntent;
    if (!intent) return;

    if (!isAuthenticated) {
      const localFallbackTimer = window.setTimeout(() => {
        fallbackToLocal();
      }, 0);

      return () => {
        window.clearTimeout(localFallbackTimer);
      };
    }

    const loadingTimer = setTimeout(() => {
      setIsLoadingFromAPI(true);
    }, 120);

    const requestTimer = setTimeout(() => {
      fetchRecommendationStack({
        query: userInput,
        budget: intent.budget,
        category: intent.categories.find((entry) => entry !== 'All') || 'All',
        follow_up_answers: {
          priority: intent.priority,
          experience_level: intent.experienceLevel,
          integration_need: intent.integrationNeed,
        },
      })
        .then(result => {
          const normalizedResult = {
            ...result,
            source: 'api',
            stack: Array.isArray(result?.stack)
              ? result.stack
              : Array.isArray(result?.recommendations)
                ? result.recommendations
                : [],
          };

          if (normalizedResult.stack.length > 0) {
            setRecommendationSource('api');
            setFormattedResult(formatRecommendationForUI(normalizedResult));
            setApiError(null);
          } else {
            fallbackToLocal();
          }
        })
        .catch(error => {
          console.warn('API recommendation failed, using local fallback:', error);
          setApiError(error.message);
          fallbackToLocal();
        })
        .finally(() => {
          setIsLoadingFromAPI(false);
        });
    }, 320);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(requestTimer);
    };
  }, [userInput, maxRecommendations, fallbackToLocal, parsedIntent, isAuthenticated]);

  const handleInputChange = useCallback((event) => {
    const nextValue = event.target.value;
    setUserInput(nextValue);

    if (!nextValue.trim()) {
      setFormattedResult(null);
      setApiError(null);
      setSelectedTools([]);
    }
  }, []);

  const handleQuickPrompt = useCallback((promptText) => {
    setUserInput(promptText);
    setApiError(null);
  }, []);

  // ============================================================================
  // VOICE INPUT HANDLER
  // ============================================================================

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      setVoiceError('Voice input not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        setVoiceError('Unable to start voice input. Please allow microphone access and try again.');
      }
    }
  }, [isListening]);

  // ============================================================================
  // COMPARISON INTEGRATION
  // ============================================================================

  const handleToolSelect = useCallback((tool) => {
    trackToolEvent(tool.id, 'compare_select');
    setSelectedTools(prev => {
      const isSelected = prev.some(t => t.id === tool.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tool.id);
      } else {
        return [...prev, tool];
      }
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (!isAuthenticated) {
      setApiError('Please sign in to unlock advanced comparison recommendations.');
      navigate('/auth');
      return;
    }

    if (selectedTools.length < 2) {
      alert('Please select at least 2 tools to compare');
      return;
    }

    // Extract comparison matrix
    const comparisonData = extractComparisonMatrix(selectedTools);

    // Navigate to comparison page with data
    navigate('/compare', {
      state: {
        selectedTools,
        comparisonData,
        source: recommendationSource,
        query: userInput,
      },
    });
  }, [selectedTools, recommendationSource, userInput, navigate, isAuthenticated]);

  const handleClearSelection = useCallback(() => {
    setSelectedTools([]);
  }, []);

  const handleSatisfactionFeedback = useCallback((sentiment) => {
    const candidateToolIds = (formattedResult?.tools || []).slice(0, 3).map((tool) => tool.id);
    if (candidateToolIds.length === 0) return;

    trackRecommendationFeedback(candidateToolIds, sentiment);
    setFeedbackStatus(sentiment === 'helpful' ? 'Thanks! We will prioritize similar tools.' : 'Thanks! We will improve the next recommendations.');
  }, [formattedResult]);

  // ============================================================================
  // ADVANCED OPTIONS HANDLERS
  // ============================================================================

  const handleWeightChange = useCallback((weightKey, value) => {
    setCustomWeights(prev => ({
      ...prev,
      [weightKey]: parseFloat(value),
    }));
  }, []);

  // ============================================================================
  // RENDERING HELPERS
  // ============================================================================

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-medium';
    return 'confidence-low';
  };

  const getSourceBadge = () => {
    if (!recommendationSource) return null;
    
    if (recommendationSource === 'api') {
      return <span className="badge badge-api">🔗 Backend AI</span>;
    }
    if (recommendationSource === 'local') {
      return <span className="badge badge-local">💻 Local Engine</span>;
    }
    
    return null;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="stack-builder-enhanced">
      <div className="stack-builder-container">
        {/* HEADER */}
        <header className="stack-builder-header">
          <h1 className="display">Build Your AI Stack</h1>
          <p className="subtitle">
            Describe what you need, and get personalized AI tool recommendations in real-time
          </p>
        </header>

        {/* INPUT SECTION */}
        <section className="input-section">
          <div className="input-wrapper">
            <textarea
              className="requirement-input"
              placeholder="Tell me what you need... e.g., 'I need free AI tools for image editing and quick social media design for my solo freelance business'"
              value={userInput}
              onChange={handleInputChange}
              disabled={isListening}
              rows="4"
            />

            <div className="browser-status" role="status" aria-live="polite">
              <span className={`browser-pill ${browserCapabilities.online ? 'good' : 'warn'}`}>
                {browserCapabilities.online ? 'Online' : 'Offline mode'}
              </span>
              <span className={`browser-pill ${browserCapabilities.speechSupported ? 'good' : 'warn'}`}>
                {browserCapabilities.speechSupported ? 'Voice supported' : 'Voice not supported in this browser'}
              </span>
              <span className="browser-pill neutral">Works in Chrome, Edge, Firefox, Safari</span>
            </div>

            <div className="quick-prompts" aria-label="Quick prompt suggestions">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="quick-prompt-chip"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="input-controls">
              <button
                className={`btn-voice ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceInput}
                title={isListening ? 'Stop listening' : 'Start voice input'}
                disabled={!browserCapabilities.speechSupported}
              >
                {isListening ? <FiSquare size={18} /> : <FiMic size={18} />}
                {isListening ? 'Listening...' : 'Voice Input'}
              </button>

              <button
                className="btn-secondary"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <FiChevronDown size={16} />
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {voiceError && <div className="error-message">{voiceError}</div>}
            {apiError && (
              <div className="warning-message">
                Using local engine: {apiError}
              </div>
            )}

            {!isAuthenticated && (
              <div className="warning-message auth-required-note">
                Sign in to unlock high-accuracy backend suggestions, live confidence scoring, and smarter compare recommendations.
              </div>
            )}
          </div>

          {/* PARSED INTENT FEEDBACK */}
          {parsedIntent && (
            <div className={`intent-feedback ${getConfidenceColor(parsedIntent.confidence)}`}>
              <div className="intent-row">
                <span className="intent-label">Budget:</span>
                <span className="intent-value">{parsedIntent.budget}</span>
              </div>

              <div className="intent-row">
                <span className="intent-label">Categories:</span>
                <span className="intent-value">
                  {parsedIntent.categories.join(', ')}
                </span>
              </div>

              <div className="intent-row">
                <span className="intent-label">Priority:</span>
                <span className="intent-value">{parsedIntent.priority}</span>
              </div>

              <div className="intent-row">
                <span className="intent-label">Experience:</span>
                <span className="intent-value">{parsedIntent.experienceLevel}</span>
              </div>

              {parsedIntent.keywords.length > 0 && (
                <div className="intent-row">
                  <span className="intent-label">Keywords:</span>
                  <div className="keyword-tags">
                    {parsedIntent.keywords.map((kw, i) => (
                      <span key={i} className="keyword-tag">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="confidence-meter">
                <div
                  className="confidence-bar"
                  style={{ width: `${parsedIntent.confidence * 100}%` }}
                />
                <span className="confidence-label">
                  {Math.round(parsedIntent.confidence * 100)}% confidence
                </span>
              </div>

              {hasLowConfidence && (
                <div className="refine-tip">
                  Tip: add your budget, use-case, and team size for even better recommendations.
                </div>
              )}
            </div>
          )}

          {/* ADVANCED OPTIONS */}
          {showAdvancedOptions && (
            <div className="advanced-options">
              <div className="option-group">
                <label>Max Recommendations:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxRecommendations}
                  onChange={(e) => setMaxRecommendations(parseInt(e.target.value))}
                />
              </div>

              <div className="option-group">
                <label>Scoring Weights (optional):</label>
                <div className="weight-controls">
                  <label>
                    Keyword Match:
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={customWeights.keywordMatch || 0.3}
                      onChange={(e) => handleWeightChange('keywordMatch', e.target.value)}
                    />
                  </label>
                  <label>
                    Category Match:
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={customWeights.categoryMatch || 0.25}
                      onChange={(e) => handleWeightChange('categoryMatch', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* LOADING STATE */}
        {(isLoadingFromAPI || isLoadingFromLocal) && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Analyzing your needs and finding the best tools...</p>
          </div>
        )}

        {/* RESULTS SECTION */}
        {formattedResult && (
          <section className="results-section">
            {/* METADATA */}
            <div className="results-meta">
              <p className="explanation">{formattedResult.meta.explanation}</p>
              <div className="source-info">
                {getSourceBadge()}
                <span className="timestamp">
                  {new Date(formattedResult.meta.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="satisfaction-widget">
                <p className="satisfaction-title">Was this recommendation helpful?</p>
                <div className="satisfaction-actions">
                  <button type="button" className="satisfaction-btn" onClick={() => handleSatisfactionFeedback('helpful')}>
                    👍 Helpful
                  </button>
                  <button type="button" className="satisfaction-btn" onClick={() => handleSatisfactionFeedback('not_helpful')}>
                    👎 Not Helpful
                  </button>
                </div>
                {feedbackStatus && <p className="satisfaction-status">{feedbackStatus}</p>}
              </div>
            </div>

            {/* STACK RECOMMENDATIONS */}
            {formattedResult.tools.length > 0 && (
              <div className="stack-results">
                <h2>Recommended AI Tools</h2>
                <div className="tools-grid">
                  {formattedResult.tools.map((tool, index) => (
                    <div
                      key={tool.id}
                      className={`tool-card ${
                        selectedTools.some(t => t.id === tool.id) ? 'selected' : ''
                      }`}
                    >
                      {/* RANK & SCORE */}
                      <div className="tool-header">
                        <div className="rank-badge">#{index + 1}</div>
                        <div className="score-badge">{Math.round(tool.score * 10)}/10</div>
                        <input
                          type="checkbox"
                          className="tool-checkbox"
                          checked={selectedTools.some(t => t.id === tool.id)}
                          onChange={() => handleToolSelect(tool)}
                        />
                      </div>

                      {/* TOOL INFO */}
                      <div className="tool-info">
                        {tool.logo && (
                          <img
                            src={tool.logo}
                            alt={tool.name}
                            className="tool-logo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <h3>{tool.name}</h3>
                        <p className="tool-description">{tool.description}</p>
                      </div>

                      {/* METADATA */}
                      <div className="tool-meta">
                        {tool.category && (
                          <span className="tag">{tool.category}</span>
                        )}
                        {tool.pricing && (
                          <span className="price">{tool.pricing}</span>
                        )}
                      </div>

                      {/* REASONING */}
                      {tool.reasoning && tool.reasoning.length > 0 && (
                        <div className="reasoning">
                          <button
                            className="reasoning-toggle"
                            onClick={() => {
                              setExpandedDetails(
                                expandedDetails === tool.id ? null : tool.id
                              );
                            }}
                          >
                            Why this tool? {expandedDetails === tool.id ? '▼' : '▶'}
                          </button>
                          {expandedDetails === tool.id && (
                            <ul className="reasoning-list">
                              {tool.reasoning.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        onClick={() => trackToolEvent(tool.id, 'open_from_stack')}
                      >
                        Visit Website →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WORKFLOW (if available) */}
            {formattedResult.workflow && formattedResult.workflow.steps.length > 0 && (
              <div className="workflow-section">
                <h2>Suggested Workflow: {formattedResult.workflow.type}</h2>
                <div className="workflow-steps">
                  {formattedResult.workflow.steps.map((step, index) => (
                    <div key={index} className="workflow-step">
                      <div className="step-number">{index + 1}</div>
                      <div className="step-content">
                        <h4>{step.phase}</h4>
                        {step.tool && (
                          <p className="step-tool">
                            Suggested: <strong>{step.tool.name}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPARISON SECTION */}
            {selectedTools.length > 0 && (
              <div className="comparison-section">
                <div className="comparison-info">
                  <h3>
                    Selected Tools for Comparison ({selectedTools.length})
                  </h3>
                  <p>Choose tools to compare side-by-side features and capabilities</p>
                </div>

                <div className="comparison-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleCompare}
                    disabled={selectedTools.length < 2}
                  >
                    Compare Selected Tools ({selectedTools.length})
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClearSelection}
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="selected-tools-preview">
                  {selectedTools.map(tool => (
                    <div key={tool.id} className="selected-tool-tag">
                      {tool.name}
                      <button
                        className="remove-btn"
                        onClick={() => handleToolSelect(tool)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* EMPTY STATE */}
        {!userInput.trim() && (
          <section className="empty-state">
            <h2>Start Building Your Stack</h2>
            <p>
              Describe your needs in plain language. Be specific about your budget,
              use case, and preferences.
            </p>
            <div className="example-inputs">
              <p>Examples:</p>
              <ul>
                <li>
                  "I need free AI tools for image editing and social media design"
                </li>
                <li>
                  "Premium coding assistants for enterprise development team"
                </li>
                <li>
                  "Easy-to-use automation tools for small business workflows"
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
