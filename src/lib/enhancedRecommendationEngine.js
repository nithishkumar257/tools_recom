/**
 * Enhanced Recommendation Engine
 * 
 * Handles ANY user input and produces intelligent, adaptive recommendations
 * with real-time reactivity and graceful fallbacks.
 */

import { aiTools } from '../data/aiTools';

// ============================================================================
// 1. ADVANCED INPUT PARSING & NORMALIZATION
// ============================================================================

/**
 * Comprehensive input parser that handles diverse user inputs
 * Returns structured intent including: budget, category, priority, experience, keywords
 */
export function parseUserInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return getDefaultIntent();
  }

  const text = rawInput.toLowerCase().trim();
  
  // Extract intent patterns
  const intent = {
    originalInput: rawInput,
    normalizedInput: text,
    keywords: extractKeywords(text),
    budget: detectBudget(text),
    categories: detectCategories(text),
    priority: detectPriority(text),
    experienceLevel: detectExperienceLevel(text),
    useCase: detectUseCase(text),
    integrationNeed: detectIntegrationNeed(text),
    urgency: detectUrgency(text),
    teamSize: detectTeamSize(text),
    confidence: 0.5, // Will be calculated based on pattern matches
  };

  // Increase confidence based on specificity
  intent.confidence = Math.min(1.0, (
    (intent.keywords.length / 5) * 0.2 +
    (intent.categories.length / 3) * 0.2 +
    (intent.priority ? 0.2 : 0) +
    (intent.useCase ? 0.2 : 0) +
    0.2 // Base confidence
  ));

  return intent;
}

/**
 * Extract meaningful keywords from input
 */
function extractKeywords(text) {
  // Filter out stop words and extract technical terms
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'it\'s', 'that\'s', 'what\'s', 'where\'s', 'need', 'want',
    'looking', 'use', 'find', 'get', 'make', 'help', 'tool', 'application',
    'software', 'something', 'anything', 'help', 'my', 'your', 'me',
  ]);

  const words = text.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  return [...new Set(words)].slice(0, 15); // Return unique, max 15
}

/**
 * Detect budget intent from user input
 * Returns: 'free', 'premium', 'mixed', 'flexible'
 */
function detectBudget(text) {
  const freePatterns = [
    /\bfree\b/, /\bno cost/, /\bwithout paying/, /\bzero\s*cost/, 
    /\bcheap/, /\bno money/, /\bno budget/, /\bopen source/, /\bfoss/,
    /\baffordable/, /\bbudget/, /\bfree tier/
  ];
  
  const premiumPatterns = [
    /\bpremium/, /\benterprise/, /\bpaid/, /\bexpensive/, /\bpay/, 
    /\bad free/, /\bbest possible/, /\btop quality/, /\bhigh.*quality/,
    /\bunlimited/, /\bpro\b/, /\bplus\b/, /\bprofessional/, /\bcorporate/
  ];

  const freeMatches = freePatterns.filter(p => p.test(text)).length;
  const premiumMatches = premiumPatterns.filter(p => p.test(text)).length;

  if (freeMatches > premiumMatches) return 'free';
  if (premiumMatches > freeMatches) return 'premium';
  if (freeMatches > 0 || premiumMatches > 0) return 'flexible'; // Mixed signals
  
  return 'mixed'; // Default neutral
}

/**
 * Detect tool categories from input
 * Returns: ['Design', 'Coding', 'Writing', 'Productivity', 'AI/ML', 'Automation', 'Marketing']
 */
function detectCategories(text) {
  const categoryPatterns = {
    'Design': [/design/, /graphics/, /ui\/ux/, /ux/, /ui/, /visual/, /creative/, /photo/, /image/, /video/, /3d/, /sketch/, /figma/, /adobe/],
    'Coding': [/code/, /develop/, /programming/, /build/, /engineer/, /debug/, /backend/, /frontend/, /full.?stack/, /api/, /database/, /sql/],
    'Writing': [/write/, /content/, /blog/, /copy/, /article/, /document/, /text/, /documentation/, /communication/, /email/],
    'Productivity': [/project/, /task/, /manage/, /collaborate/, /meeting/, /calendar/, /scheduling/, /organization/, /workflow/, /note/],
    'AI/ML': [/ai/, /machine.?learning/, /neural/, /gpt/, /model/, /deep/, /learning/, /algorithm/, /neural/, /llm/, /nlp/],
    'Automation': [/automat/, /workflow/, /bot/, /integrat/, /zapier/, /ifttt/, /trigger/, /action/, /process/],
    'Marketing': [/marketing/, /seo/, /ppc/, /social/, /social.?media/, /analytics/, /campaign/, /branding/, /email/, /lead/],
    'Data': [/data/, /analytics/, /business.?intellig/, /bi/, /dashboard/, /chart/, /graph/, /visualization/, /report/],
    'Security': [/security/, /encrypt/, /password/, /auth/, /firewall/, /vpn/, /privacy/, /compliance/, /gdpr/],
  };

  const detected = [];
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => p.test(text))) {
      detected.push(category);
    }
  }

  return detected.length > 0 ? detected : ['All'];
}

/**
 * Detect user priority (what matters most)
 * Returns: 'speed' | 'quality' | 'ease' | 'cost' | 'balanced'
 */
function detectPriority(text) {
  const priorityMap = {
    speed: [/fast/, /quick/, /real.?time/, /instant/, /urgent/, /asap/, /immediately/, /low.?latency/],
    quality: [/high.*quality/, /best/, /top/, /premium/, /accurate/, /precise/, /reliable/, /robust/],
    ease: [/easy/, /simple/, /intuitive/, /user.?friendly/, /no.*learning/, /straightforward/, /beginner/],
    cost: [/cheap/, /free/, /budget/, /inexpensive/, /affordable/, /economical/, /low.*cost/],
  };

  const scores = {};
  for (const [priority, patterns] of Object.entries(priorityMap)) {
    scores[priority] = patterns.filter(p => p.test(text)).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'balanced';
  
    return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'balanced';
}

/**
 * Detect user experience level
 * Returns: 'beginner' | 'intermediate' | 'advanced'
 */
function detectExperienceLevel(text) {
  const beginnerPatterns = [/beginner/, /newbie/, /new to/, /first time/, /learn/, /noob/, /start/];
  const advancedPatterns = [/advanced/, /expert/, /professional/, /seasoned/, /experienced/, /enterprise/];

  const beginnerMatches = beginnerPatterns.filter(p => p.test(text)).length;
  const advancedMatches = advancedPatterns.filter(p => p.test(text)).length;

  if (beginnerMatches > advancedMatches) return 'beginner';
  if (advancedMatches > beginnerMatches) return 'advanced';
  return 'intermediate'; // Default
}

/**
 * Detect use case pattern
 * Returns: 'content_creation' | 'development' | 'analytics' | 'general' | null
 */
function detectUseCase(text) {
  const contentPatterns = [/content/, /blog/, /article/, /social/, /media/, /publish/, /writer/];
  const devPatterns = [/develop/, /code/, /build/, /engineer/, /programming/, /app/];
  const analyticsPatterns = [/analytics/, /data/, /insight/, /report/, /metric/, /track/];

  const contentMatches = contentPatterns.filter(p => p.test(text)).length;
  const devMatches = devPatterns.filter(p => p.test(text)).length;
  const analyticsMatches = analyticsPatterns.filter(p => p.test(text)).length;

  if (contentMatches > 0) return 'content_creation';
  if (devMatches > 0) return 'development';
  if (analyticsMatches > 0) return 'analytics';
  return null;
}

/**
 * Detect integration needs
 * Returns: 'yes' | 'optional' | 'no'
 */
function detectIntegrationNeed(text) {
  const needPatterns = [/integrat/, /connect/, /sync/, /combined/, /ecosystem/, /together/];
  const optionalPatterns = [/nice.*have/, /if available/, /prefer/, /optional/];
  const noPatterns = [/standalone/, /alone/, /independent/, /isolated/];

  if (needPatterns.some(p => p.test(text))) return 'yes';
  if (optionalPatterns.some(p => p.test(text))) return 'optional';
  if (noPatterns.some(p => p.test(text))) return 'no';
  
  return 'optional'; // Default
}

/**
 * Detect urgency level
 * Returns: 1-10 scale (10 = most urgent)
 */
function detectUrgency(text) {
  const urgencyKeywords = [
    { keyword: /asap|urgent|immediately|now|emergency|critical|blocking/, score: 10 },
    { keyword: /soon|quickly|quickly|this week|today/, score: 8 },
    { keyword: /next week|next month/, score: 5 },
    { keyword: /eventually|sometime|when.*ready/, score: 2 },
  ];

  for (const { keyword, score } of urgencyKeywords) {
    if (keyword.test(text)) return score;
  }

  return 5; // Default medium urgency
}

/**
 * Detect team size context
 * Returns: 'solo' | 'small' | 'medium' | 'large'
 */
function detectTeamSize(text) {
  if (/\balone\b|\bme\b|\bsolo\b|\bbyself\b/.test(text)) return 'solo';
  if (/\btiny team\b|\bsmall team\b|\b2.?5 people\b|\bfreelancer/.test(text)) return 'small';
  if (/\bteam of\s*[5-9]\b|\b10.?20\b|\bmedium/.test(text)) return 'medium';
  if (/\blarge team\b|\b50+\b|\benterprise\b|\bcompany\b/.test(text)) return 'large';
  
  return 'small'; // Default
}

/**
 * Get default intent when input is empty/invalid
 */
function getDefaultIntent() {
  return {
    originalInput: '',
    normalizedInput: '',
    keywords: [],
    budget: 'mixed',
    categories: ['All'],
    priority: 'balanced',
    experienceLevel: 'intermediate',
    useCase: null,
    integrationNeed: 'optional',
    urgency: 5,
    teamSize: 'small',
    confidence: 0,
  };
}

// ============================================================================
// 2. ADVANCED SCORING & RANKING
// ============================================================================

/**
 * Enhanced multi-factor scoring algorithm
 * Scores tools based on parsed intent and relevance
 */
export function scoreTools(tools, intent, weightsOverride = {}) {
  const defaultWeights = {
    keywordMatch: 0.30,      // Keyword relevance
    categoryMatch: 0.25,      // Category alignment
    budgetFit: 0.20,          // Budget compatibility
    experienceLevel: 0.10,    // User skill level fit
    integrationCapability: 0.08, // Integration features
    trendingScore: 0.05,      // Popularity/trending
    recency: 0.02,            // Recently updated
  };

  const weights = { ...defaultWeights, ...weightsOverride };

  return tools.map(tool => {
    const scores = {
      keywordMatch: calculateKeywordMatch(tool, intent.keywords),
      categoryMatch: calculateCategoryMatch(tool, intent.categories),
      budgetFit: calculateBudgetFit(tool, intent.budget),
      experienceLevel: calculateExperienceFit(tool, intent.experienceLevel),
      integrationCapability: calculateIntegrationScore(tool, intent.integrationNeed),
        trendingScore: tool.trending ? 0.8 : 0.3,
      recency: calculateRecencyScore(tool),
    };

    // Calculate weighted total
    const totalScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (scores[key] || 0) * weight;
    }, 0);

    return {
      ...tool,
      scoringBreakdown: scores,
      totalScore: Math.round(totalScore * 100) / 100,
      reasoning: generateReasoning(tool, scores, intent),
    };
  });
}

function calculateKeywordMatch(tool, keywords) {
  if (keywords.length === 0) return 0.5; // Default if no keywords
  
  const searchSpace = `${tool.name} ${tool.description} ${(tool.tags || []).join(' ')}`.toLowerCase();
  const matches = keywords.filter(kw => searchSpace.includes(kw)).length;
  
  return Math.min(1.0, matches / keywords.length);
}

function calculateCategoryMatch(tool, categories) {
  if (categories.includes('All')) return 0.5; // Neutral
  
  const toolCategories = (tool.category || []).split(',').map(c => c.trim());
  const matches = categories.filter(cat => 
    toolCategories.some(tcf => tcf.toLowerCase().includes(cat.toLowerCase()))
  ).length;
  
  return Math.min(1.0, (matches / categories.length) * 1.2);
}

function calculateBudgetFit(tool, budget) {
  if (budget === 'mixed') return 0.6; // Neutral

  const pricing = String(tool.pricing || '').toLowerCase();
  const pricingModel = String(tool.pricing_model || '').toLowerCase();
  const isFree = pricing.includes('free') || pricingModel === 'free' || pricingModel === 'freemium';
  
  if (budget === 'free') return isFree ? 1 : 0.2;
  if (budget === 'premium') return !isFree ? 1 : 0.3;
  if (budget === 'flexible') return isFree ? 0.9 : 0.7;
  
  return 0.5;
}

function calculateExperienceFit(tool, experienceLevel) {
  const complexity = tool.complexity || 'medium'; // assume medium if not set
  
  if (experienceLevel === 'beginner') {
    return complexity === 'easy' ? 1 : complexity === 'medium' ? 0.7 : 0.2;
  }
  if (experienceLevel === 'advanced') {
    return complexity === 'hard' ? 1 : complexity === 'medium' ? 0.7 : 0.3;
  }
  // intermediate
  return 0.8; // All fit intermediate well
}

function calculateIntegrationScore(tool, integrationNeed) {
  const integrationsCount = tool.integrations ? parseInt(tool.integrations) : 0;
  
  if (integrationNeed === 'yes') {
    return Math.min(1.0, integrationsCount / 100); // Max score at 100+ integrations
  }
  if (integrationNeed === 'no') {
    return integrationsCount === 0 ? 1 : 0.5;
  }
  // optional
  return 0.7; // All are decent
}

function calculateRecencyScore(tool) {
  // Tools updated in last 30 days get higher score
  if (!tool.lastUpdated) return 0.5;
  
  const daysOld = Math.floor((Date.now() - new Date(tool.lastUpdated)) / (1000 * 60 * 60 * 24));
  return Math.max(0.1, 1 - (daysOld / 365)); // Decay over year
}

function generateReasoning(tool, scores, intent) {
  const reasons = [];
  
  if (scores.keywordMatch > 0.7) {
    reasons.push(`Strong match for "${intent.keywords.slice(0, 2).join(', ')}"`);
  }
  if (scores.budgetFit > 0.8) {
    reasons.push(`Aligns with "${intent.budget}" budget preference`);
  }
  if (scores.categoryMatch > 0.7) {
    reasons.push(`Fits "${intent.categories.join(', ')}" category`);
  }
  if (scores.integrationCapability > 0.7 && intent.integrationNeed === 'yes') {
    reasons.push(`Offers strong integration capabilities`);
  }
  if (scores.experienceLevel > 0.8) {
    reasons.push(`Suitable for ${intent.experienceLevel} users`);
  }
  
  return reasons.slice(0, 3); // Return top 3 reasons
}

// ============================================================================
// 3. INTELLIGENT RECOMMENDATION GENERATION
// ============================================================================

/**
 * Generate stack recommendation from parsed intent
 */
export function generateStackRecommendation(intent, availableTools = aiTools, maxItems = 6, weightsOverride = {}) {
  if (!availableTools || availableTools.length === 0) {
    return {
      stack: [],
      workflow: null,
      explanation: 'No tools available',
      confidence: 0,
      source: 'empty_kb',
    };
  }

  // Filter by category if specified
  let candidates = availableTools;
  if (intent.categories && !intent.categories.includes('All')) {
    candidates = availableTools.filter(tool => {
      const toolCats = (tool.category || '').split(',').map(c => c.trim().toLowerCase());
      return intent.categories.some(cat => 
        toolCats.some(tc => tc.includes(cat.toLowerCase()))
      );
    });
  }

  // If no category match, use all tools
  if (candidates.length === 0) {
    candidates = availableTools;
  }

  // Score and rank
  const adaptiveWeights = buildAdaptiveWeights(intent, weightsOverride);
  const scored = scoreTools(candidates, intent, adaptiveWeights);
  const ranked = scored
    .filter(tool => tool.totalScore > 0) // Remove zero scores
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, maxItems);

  // Generate workflow structure
  const workflow = generateWorkflowFromIntent(intent, ranked);

  return {
    stack: ranked.map(stripScoringMetadata),
    workflow,
    explanation: `Recommended ${ranked.length} tools based on your ${intent.priority || 'balanced'} priorities with ${intent.confidence}% confidence`,
    confidence: intent.confidence,
    source: 'enhanced_engine',
  };
}

function buildAdaptiveWeights(intent, weightsOverride = {}) {
  const base = {
    keywordMatch: 0.30,
    categoryMatch: 0.25,
    budgetFit: 0.20,
    experienceLevel: 0.10,
    integrationCapability: 0.08,
    trendingScore: 0.05,
    recency: 0.02,
  };

  if (intent.priority === 'cost') {
    base.budgetFit = 0.35;
    base.keywordMatch = 0.25;
    base.categoryMatch = 0.20;
  } else if (intent.priority === 'quality') {
    base.keywordMatch = 0.35;
    base.categoryMatch = 0.30;
    base.budgetFit = 0.12;
  } else if (intent.priority === 'ease') {
    base.experienceLevel = 0.18;
    base.keywordMatch = 0.25;
    base.categoryMatch = 0.22;
  } else if (intent.priority === 'speed') {
    base.recency = 0.08;
    base.integrationCapability = 0.14;
    base.keywordMatch = 0.27;
  }

  return { ...base, ...weightsOverride };
}

function stripScoringMetadata(tool) {
  const cleaned = { ...tool };
  delete cleaned.scoringBreakdown;
  return cleaned;
}

/**
 * Generate structured workflow from intent and tools
 */
function generateWorkflowFromIntent(intent, tools) {
  const workflow = {
    type: intent.useCase || 'general',
    steps: [],
  };

  if (intent.useCase === 'content_creation') {
    workflow.steps = [
      { phase: 'Research & Planning', tool: tools[0] || null },
      { phase: 'Content Creation', tool: tools[1] || null },
      { phase: 'Editing & Polish', tool: tools[2] || null },
      { phase: 'Publishing & Distribution', tool: tools[3] || null },
    ];
  } else if (intent.useCase === 'development') {
    workflow.steps = [
      { phase: 'Planning & Design', tool: tools[0] || null },
      { phase: 'Development', tool: tools[1] || null },
      { phase: 'Testing & QA', tool: tools[2] || null },
      { phase: 'Deployment', tool: tools[3] || null },
    ];
  } else {
    // Generic workflow
    workflow.steps = [
      { phase: 'Primary Task', tool: tools[0] || null },
      { phase: 'Supporting Tool', tool: tools[1] || null },
      { phase: 'Integration/Automation', tool: tools[2] || null },
    ];
  }

  return workflow;
}

// ============================================================================
// 4. COMPARISON DATA EXTRACTION
// ============================================================================

/**
 * Extract comparison matrix from selected tools
 */
export function extractComparisonMatrix(tools, customFeatures = null) {
  if (!tools || tools.length === 0) {
    return { tools: [], features: [], matrix: {} };
  }

  // Default comparison features
  const defaultFeatures = [
    { key: 'pricing', label: 'Pricing', type: 'text' },
    { key: 'freeTier', label: 'Free Tier', type: 'boolean' },
    { key: 'setupTime', label: 'Setup Time', type: 'text' },
    { key: 'integrations', label: 'Integrations', type: 'number' },
    { key: 'support', label: 'Support', type: 'text' },
    { key: 'learning_curve', label: 'Learning Curve', type: 'text' },
    { key: 'collaboration', label: 'Collaboration', type: 'boolean' },
    { key: 'api_available', label: 'API Available', type: 'boolean' },
    { key: 'lastUpdated', label: 'Last Updated', type: 'date' },
  ];

  const features = customFeatures || defaultFeatures;

  // Extract values from each tool
  const matrix = {};
  tools.forEach(tool => {
    matrix[tool.id] = {};
    features.forEach(feature => {
      const value = tool[feature.key];
      matrix[tool.id][feature.key] = formatFeatureValue(value, feature.type);
    });
  });

  return {
    tools: tools.map(stripScoringMetadata),
    features,
    matrix,
  };
}

function formatFeatureValue(value, type) {
  if (value === null || value === undefined) return 'N/A';
  
  if (type === 'date') {
    return new Date(value).toLocaleDateString();
  }
  if (type === 'number') {
    return value.toString();
  }
  if (type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
}

// ============================================================================
// 5. ERROR HANDLING & FALLBACKS
// ============================================================================

/**
 * Robust recommendation with fallbacks
 */
export function robustRecommendation(input, tools = aiTools, options = {}) {
  try {
    const { maxItems = 6, weightsOverride = {} } = options;

    // Parse input
    const intent = parseUserInput(input);
    
    // Generate recommendation
    const recommendation = generateStackRecommendation(intent, tools, maxItems, weightsOverride);
    
    // Fallback if no results
    if (recommendation.stack.length === 0) {
      return {
        ...recommendation,
        stack: tools.slice(0, 6).sort(() => Math.random() - 0.5),
        explanation: `Couldn't find specific matches. Showing popular tools instead.`,
        source: 'fallback_random',
      };
    }

    return recommendation;
  } catch (error) {
    console.error('Recommendation error:', error);
    
    // Ultimate fallback: return top trending tools
    return {
      stack: tools
        .filter(t => t.trending)
        .slice(0, 6)
        .concat(tools.slice(0, 6 - Math.min(6, tools.filter(t => t.trending).length))),
      workflow: null,
      explanation: 'Showing trending tools due to processing error',
      confidence: 0,
      source: 'fallback_error',
    };
  }
}

// ============================================================================
// 6. REAL-TIME REACTIVITY HELPERS
// ============================================================================

/**
 * Debounced recommendation with cancellation support
 */
export function createDebouncedRecommender(delayMs = 300) {
  let timeoutId = null;
  let abortController = new AbortController();

  return {
    recommend: (input, tools, options, callback) => {
      const normalizedOptions = typeof options === 'function' ? {} : (options || {});
      const normalizedCallback = typeof options === 'function' ? options : callback;

      // Cancel previous request
      abortController.abort();
      abortController = new AbortController();

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Set new timeout
      timeoutId = setTimeout(() => {
        const result = robustRecommendation(input, tools, normalizedOptions);
        normalizedCallback?.(result);
      }, delayMs);
    },

    cancel: () => {
      if (timeoutId) clearTimeout(timeoutId);
      abortController.abort();
    },

    getAbortSignal: () => abortController.signal,
  };
}

/**
 * Format recommendation for UI display
 */
export function formatRecommendationForUI(recommendation) {
  const rawTools = Array.isArray(recommendation?.stack)
    ? recommendation.stack
    : Array.isArray(recommendation?.recommendations)
      ? recommendation.recommendations
      : [];

  const normalizedWorkflow = (() => {
    const workflow = recommendation?.workflow;
    if (!workflow || !Array.isArray(workflow.steps)) {
      return null;
    }

    const steps = workflow.steps
      .map((step) => {
        if (step?.phase || step?.tool) {
          return {
            phase: step.phase || step.role || 'Step',
            tool: step.tool || step.primary || null,
          };
        }

        if (step?.primary || step?.alternative) {
          return {
            phase: step.role || 'Step',
            tool: step.primary || step.alternative || null,
          };
        }

        return null;
      })
      .filter(Boolean);

    return {
      type: workflow.type || workflow.template || 'general',
      steps,
    };
  })();

  return {
    tools: rawTools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      pricing: tool.pricing,
      score: Number.isFinite(tool.totalScore)
        ? tool.totalScore
        : Math.max(0, Math.min(10, Number(tool.compatibility_score || tool.score || 0) / 10)),
      reasoning: Array.isArray(tool.reasoning) ? tool.reasoning : [],
      url: tool.url,
      logo: tool.logo_url,
    })),
    workflow: normalizedWorkflow,
    meta: {
      explanation: recommendation.explanation || 'Recommendations generated from your requirements.',
      confidence: recommendation.confidence || recommendation.rationale?.average_compatibility_score || 0,
      source: recommendation.source || 'api',
      timestamp: new Date().toISOString(),
    },
  };
}

export default {
  parseUserInput,
  scoreTools,
  generateStackRecommendation,
  extractComparisonMatrix,
  robustRecommendation,
  createDebouncedRecommender,
  formatRecommendationForUI,
};
