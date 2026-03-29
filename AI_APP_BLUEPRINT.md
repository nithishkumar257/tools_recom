# AI Brutal — The Ultimate AI Tools Platform

## Vision

A cross-platform, AI-powered application that catalogs **thousands of AI tools**, continuously updates in real-time, and intelligently recommends **complete tool stacks** based on user requirements — powered by a multi-agent backend.

> **Implementation Constraint:** The project implementation plan must run at **$0 recurring cost** using open-source, self-hosted, or permanent free-tier services.

---

## Table of Contents

1. [Platform & Cross-Platform Strategy](#1-platform--cross-platform-strategy)
2. [Core Features](#2-core-features)
3. [AI Tools Database — The Catalog](#3-ai-tools-database--the-catalog)
4. [Backend Architecture](#4-backend-architecture)
5. [Multi-Agent System](#5-multi-agent-system)
6. [Real-Time Update Pipeline](#6-real-time-update-pipeline)
7. [AI-Powered Stack Recommender](#7-ai-powered-stack-recommender)
8. [API Design](#8-api-design)
9. [Data Models](#9-data-models)
10. [Tech Stack Recommendation](#10-tech-stack-recommendation)
11. [Zero-Cost Implementation Policy](#11-zero-cost-implementation-policy)
12. [Roadmap](#12-roadmap)

---

## 1. Platform & Cross-Platform Strategy

The app must run natively on **all major platforms**:

| Platform | Technology |
|----------|-----------|
| Android | React Native / Flutter |
| iOS | React Native / Flutter |
| macOS | Electron / Tauri (desktop) |
| Windows | Electron / Tauri (desktop) |
| Linux | Electron / Tauri (desktop) |
| Web | React (PWA) |

### Recommended Approach

- **Mobile (Android + iOS):** Use **React Native** (since the existing frontend is React/JSX) or **Flutter** for a single codebase.
- **Desktop (macOS + Windows + Linux):** Use **Tauri** (Rust-based, lightweight) or **Electron** wrapping the React web app.
- **Web:** The existing React app serves as the web version and PWA.
- **Shared Logic:** Core business logic, API calls, and state management live in a shared layer consumed by all platforms.

---

## 2. Core Features

### For Users
- **Browse & Search** — Explore 1000+ AI tools across 50+ categories
- **Smart Filters** — Filter by pricing, platform, use-case, rating, popularity
- **AI Stack Builder** — Describe what you want to build → get a full tool combo recommendation
- **Tool Comparisons** — Side-by-side comparison of similar tools
- **Real-Time Updates** — Tools' stats, pricing, and availability update continuously
- **Personalized Feed** — AI learns your preferences and surfaces relevant new tools
- **Bookmarks & Collections** — Save and organize tools into custom collections
- **Community Reviews** — User ratings, reviews, and usage tips
- **Notifications** — Get alerted when new tools drop in your interest areas

### For Tool Makers
- **Submit Tools** — Tool creators can submit and manage their listings
- **Analytics Dashboard** — See how users interact with their tool listing

---

## 3. AI Tools Database — The Catalog

### Categories (50+ categories, 1000+ tools)

```
├── Code Generation
│   ├── Vibe Coding (Lovable, Emergent, Replit, Bolt, V0, Cursor)
│   ├── Code Assistants (GitHub Copilot, Codeium, Tabnine, Amazon Q)
│   └── Code Review (CodeRabbit, Sourcery, Codacy)
│
├── Databases & Backend
│   ├── BaaS (Firebase, Supabase, Appwrite, Nhost, Convex)
│   ├── Databases (PlanetScale, Neon, CockroachDB, Turso)
│   └── ORMs (Prisma, Drizzle, TypeORM)
│
├── Deployment & Hosting
│   ├── Frontend Hosting (Vercel, Netlify, Cloudflare Pages)
│   ├── Backend Hosting (Railway, Render, Fly.io)
│   └── Serverless (AWS Lambda, Cloudflare Workers, Deno Deploy)
│
├── AI/ML Platforms
│   ├── LLM APIs (OpenAI, Anthropic, Google Gemini, Mistral, Groq)
│   ├── AI Frameworks (LangChain, LlamaIndex, CrewAI, AutoGen)
│   └── Model Hosting (Replicate, Hugging Face, Together AI)
│
├── Design & Creative
│   ├── Image Gen (Midjourney, DALL-E, Stable Diffusion, Ideogram)
│   ├── Video Gen (Runway, Pika, Kling, Sora)
│   ├── UI Design (Figma AI, Galileo AI, Uizard)
│   └── Audio (ElevenLabs, Suno, Udio)
│
├── Writing & Content
│   ├── Copywriting (Jasper, Copy.ai, Writesonic)
│   ├── SEO (Surfer SEO, Clearscope, Frase)
│   └── Documentation (Mintlify, GitBook, Readme)
│
├── Productivity & Automation
│   ├── Workflow (Zapier, Make, n8n)
│   ├── Agents (AutoGPT, BabyAGI, AgentGPT)
│   └── Meeting (Otter.ai, Fireflies, Grain)
│
├── Data & Analytics
│   ├── BI Tools (Metabase, Preset, Lightdash)
│   ├── Data Pipelines (Airbyte, Fivetran, dbt)
│   └── Scraping (Apify, Bright Data, ScrapingBee)
│
├── Security & DevOps
│   ├── Security (Snyk, Socket, GitGuardian)
│   ├── Monitoring (Sentry, Datadog, Better Stack)
│   └── CI/CD (GitHub Actions, CircleCI, Buildkite)
│
├── Communication
│   ├── Chatbots (Intercom Fin, Drift, Tidio AI)
│   ├── Email (Superhuman, Shortwave, SaneBox)
│   └── Translation (DeepL, Lilt)
│
└── ... 40+ more categories
```

### Per-Tool Data Points

Each tool in the database stores:

| Field | Description |
|-------|-------------|
| `name` | Tool name |
| `slug` | URL-friendly identifier |
| `description` | Short + long description |
| `category` | Primary + secondary categories |
| `tags` | Searchable tags |
| `pricing` | Free / Freemium / Paid / Enterprise (with tier details) |
| `platforms` | Web, API, CLI, Desktop, Mobile |
| `website_url` | Official link |
| `logo_url` | Tool logo |
| `screenshots` | UI screenshots |
| `performance_score` | AI-calculated performance score (0-100) |
| `popularity_score` | Based on usage, mentions, trends |
| `specialization` | What it's best at (e.g., "fastest inference", "best free tier") |
| `pros` | Key strengths |
| `cons` | Known limitations |
| `alternatives` | Similar tools |
| `integrations` | What it integrates with |
| `api_available` | Has public API? |
| `last_updated` | When tool data was last refreshed |
| `release_date` | When the tool launched |
| `company` | Parent company |
| `community_rating` | User ratings (1-5) |
| `review_count` | Number of reviews |
| `use_cases` | Example use cases |
| `stack_compatibility` | Tools it pairs well with |

---

## 4. Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                               │
│   (React Web / React Native Mobile / Tauri Desktop)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Kong / Nginx)                   │
│            Rate Limiting · Auth · Load Balancing                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
   │  Auth        │ │  Core API   │ │  Real-Time   │
   │  Service     │ │  Service    │ │  Service     │
  │  (Keycloak/  │ │  (Node/     │ │  (WebSocket/ │
  │   Authentik) │ │   Python)   │ │   SSE)       │
   └─────────────┘ └──────┬──────┘ └──────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
   │  AI Agent   │ │  Scraper    │ │  Analytics   │
   │  Orchestr.  │ │  Service    │ │  Service     │
   │  (Python)   │ │  (Python)   │ │  (Python)    │
   └──────┬──────┘ └──────┬──────┘ └──────────────┘
          │               │
          ▼               ▼
   ┌─────────────────────────────────────────────┐
   │              MESSAGE QUEUE                    │
   │         (Redis / RabbitMQ / Kafka)            │
   └──────────────────────┬──────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
   │  PostgreSQL  │ │  Redis      │ │  Vector DB   │
  │  (Primary    │ │  (Cache +   │ │  (Qdrant     │
  │   Database)  │ │   Pub/Sub)  │ │   self-host) │
   └─────────────┘ └─────────────┘ └──────────────┘
```

### Backend Services Breakdown

| Service | Language | Responsibility |
|---------|----------|---------------|
| **Core API** | Node.js (Express/Fastify) | CRUD for tools, search, filters, user management |
| **Auth Service** | Keycloak / Authentik | Sign-up, login, OAuth, JWT tokens |
| **AI Agent Orchestrator** | Python (FastAPI) | Runs multi-agent workflows for recommendations |
| **Scraper Service** | Python (Scrapy/Playwright) | Crawls the web for new AI tools and updates |
| **Analytics Service** | Python (FastAPI) | Processes usage data, calculates scores |
| **Real-Time Service** | Node.js (Socket.io) | Pushes live updates to clients via WebSocket |
| **Search Service** | PostgreSQL FTS / Meilisearch (self-hosted) | Full-text + faceted search across tools |
| **Job Scheduler** | Bull (Node) / Celery (Python) | Schedules periodic scraping, scoring, updates |

### Authentication Integration Rule

- **User sign-up and login are delegated to external auth providers** (e.g., Supabase Auth, Auth0, Firebase Auth, Keycloak, Authentik).
- The platform backend should **only verify access tokens/claims** and apply authorization rules for protected APIs.
- Do **not** implement custom username/password storage or local auth flows in this project.

---

## 5. Multi-Agent System

The AI backend uses **multiple specialized agents** that collaborate to power the platform:

### Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                       │
│    Coordinates all other agents, manages workflows   │
└──────────┬──────────┬──────────┬───────────┬────────┘
           │          │          │           │
     ┌─────▼────┐ ┌──▼─────┐ ┌─▼────────┐ ┌▼──────────┐
     │ Discovery│ │ Eval   │ │ Recommend│ │ Content   │
     │ Agent    │ │ Agent  │ │ Agent    │ │ Agent     │
     └──────────┘ └────────┘ └──────────┘ └───────────┘
           │          │          │           │
     ┌─────▼────┐ ┌──▼─────┐ ┌─▼────────┐ ┌▼──────────┐
     │ Monitor  │ │ Trend  │ │ Compare  │ │ User      │
     │ Agent    │ │ Agent  │ │ Agent    │ │ Profile   │
     └──────────┘ └────────┘ └──────────┘ │ Agent     │
                                          └───────────┘
```

### Agent Descriptions

#### 1. Orchestrator Agent
- **Role:** Central coordinator — receives user requests and delegates to specialized agents
- **Tech:** LangChain / CrewAI / AutoGen
- **Responsibilities:**
  - Parse user intent (e.g., "I want to build a SaaS app")
  - Decide which agents to invoke
  - Aggregate results from multiple agents
  - Return final structured response

#### 2. Discovery Agent
- **Role:** Find and catalog new AI tools from across the internet
- **Tech:** Python + Scrapy + Playwright + LLM
- **Responsibilities:**
  - Crawl Product Hunt, GitHub Trending, Hacker News, Twitter/X, Reddit
  - Crawl AI tool directories (There's An AI For That, FutureTools, etc.)
  - Extract tool metadata (name, description, pricing, category)
  - Deduplicate against existing database
  - Score novelty and relevance
  - Submit new tools for evaluation
- **Schedule:** Runs every 6 hours

#### 3. Evaluation Agent
- **Role:** Score and rank tools on performance, reliability, and value
- **Tech:** Python + local/open-source LLM + API testing
- **Responsibilities:**
  - Test tool APIs for response time and uptime
  - Analyze user reviews and sentiment
  - Calculate performance scores (0-100)
  - Assess pricing value (features per dollar)
  - Identify each tool's specialization / unique strength
  - Update scores weekly
- **Key Metrics:**
  - `performance_score` — Speed, accuracy, reliability
  - `value_score` — Features vs. price
  - `popularity_score` — Community adoption, GitHub stars, mentions
  - `innovation_score` — Unique features vs. competitors

#### 4. Recommendation Agent (Stack Builder)
- **Role:** Recommend complete tool stacks based on user requirements
- **Tech:** Python + local/open-source LLM + Vector Search + RAG
- **Responsibilities:**
  - Accept natural language input: *"I want to build a mobile app with AI features"*
  - Break down requirements into categories
  - Detect user budget mode (free-only, mixed, premium)
  - Search vector DB for best tool matches per category
  - Consider tool compatibility and integrations
  - Generate ranked stack recommendations with reasoning and budget-fit explanation
  - Return both free and paid options when user requests mixed recommendations
  - Provide alternatives for each slot in the stack
- **Example Output:**
  ```
  User: "I want to build a SaaS web app with AI chatbot"
  
  Recommended Stack:
  ├── Vibe Coding:     VS Code + Continue/Cline (open-source assistant)
  ├── Frontend:        Next.js + Tailwind CSS
  ├── Backend/DB:      PostgreSQL + Redis + Keycloak (self-hosted)
  ├── AI/LLM:          Ollama + open model + LangChain/LangGraph
  ├── Deployment:      Docker Compose (local/self-hosted)
  ├── Payments:        Deferred in zero-cost MVP
  ├── Analytics:       Umami (self-hosted)
  ├── Monitoring:      Uptime Kuma + Prometheus + Grafana
  └── Email:           SMTP via existing mailbox / deferred
  
  Why this stack:
  - No mandatory paid vendor lock-in
  - Local/open-source AI keeps inference cost at $0 recurring
  - LangChain/LangGraph still supports robust orchestration
  - Total estimated recurring cost: $0/month (assuming existing hardware)
  ```

#### 5. Monitoring Agent
- **Role:** Track tool health, uptime, pricing changes, and breaking changes
- **Tech:** Python + HTTP probes + local/open-source LLM for changelog parsing
- **Responsibilities:**
  - Ping tool APIs and check status pages every 30 minutes
  - Detect pricing changes by monitoring pricing pages
  - Parse changelogs and release notes for major updates
  - Flag deprecated or discontinued tools
  - Alert users who use affected tools
  - Update tool records in real-time

#### 6. Trend Agent
- **Role:** Analyze market trends and predict rising/falling tools
- **Tech:** Python + local/open-source LLM + public trend sources
- **Responsibilities:**
  - Track social media mentions (Twitter/X, Reddit, HN)
  - Analyze Google Trends data
  - Monitor GitHub star velocity
  - Identify emerging categories (e.g., "AI video generation" rising)
  - Generate weekly trend reports
  - Predict which tools are gaining/losing traction

#### 7. Comparison Agent
- **Role:** Generate detailed side-by-side tool comparisons
- **Tech:** Python + local/open-source LLM + Structured data
- **Responsibilities:**
  - Compare tools within the same category
  - Generate feature matrices
  - Highlight key differentiators
  - Provide "Best for X" verdicts
  - Keep comparisons updated as tools change

#### 8. Content Agent
- **Role:** Generate and maintain tool descriptions, summaries, and guides
- **Tech:** Python + local/open-source LLM
- **Responsibilities:**
  - Write/rewrite tool descriptions from scraped data
  - Generate "Getting Started" guides for popular tools
  - Create category overview articles
  - Summarize user reviews into pros/cons
  - Ensure consistent tone and quality

#### 9. User Profile Agent
- **Role:** Learn user preferences and personalize the experience
- **Tech:** Python + LLM + Collaborative filtering
- **Responsibilities:**
  - Track user interactions (views, bookmarks, searches)
  - Build user preference profile (preferred categories, budget, skill level)
  - Personalize tool feed and recommendations
  - Send personalized notifications for new tools
  - Respect privacy — all profiling is opt-in

---

## 6. Real-Time Update Pipeline

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Discovery │───▶│  Message   │───▶│  Processor │───▶│  Database  │
│  Agent     │    │  Queue     │    │  Workers   │    │  (Postgres)│
└────────────┘    └────────────┘    └────────────┘    └─────┬──────┘
                                                            │
┌────────────┐    ┌────────────┐    ┌────────────┐          │
│  Monitoring│───▶│  Message   │───▶│  Real-Time │◀─────────┘
│  Agent     │    │  Queue     │    │  Service   │   (DB change stream)
└────────────┘    └────────────┘    └─────┬──────┘
                                          │ WebSocket / SSE
                                          ▼
                                    ┌────────────┐
                                    │  All Client│
                                    │  Apps      │
                                    └────────────┘
```

### How It Works

1. **Discovery Agent** finds a new tool → publishes `tool.new` event to message queue
2. **Monitoring Agent** detects a change → publishes `tool.updated` event
3. **Processor Workers** validate, enrich, and save to PostgreSQL
4. **PostgreSQL triggers** (pg_notify or custom trigger workers) emit change events
5. **Real-Time Service** picks up changes and pushes to connected clients via WebSocket
6. **Clients** receive updates and hot-swap UI data without page refresh

### Update Frequencies

| Data Point | Update Frequency |
|-----------|-----------------|
| New tool discovery | Every 6 hours |
| Tool uptime/status | Every 30 minutes |
| Performance scores | Weekly |
| Pricing changes | Daily |
| User reviews | Real-time (on submit) |
| Trend scores | Daily |
| Popularity scores | Daily |
| Tool descriptions | On change detection |

---

## 7. AI-Powered Stack Recommender

This is the **killer feature** — the brain of the app.

### Budget-Aware Recommendation Rule

For app AI-tool recommendations, the engine should adapt to the user requirement:

- **Free-only mode:** recommend only free/open-source options
- **Mixed mode:** recommend both free and paid options, ranked by utility and value
- **Premium mode:** include best-performing paid tools with clear cost/benefit trade-offs
- Always provide at least one free alternative in each recommendation path

Note: this rule governs user-facing tool recommendations. The project implementation policy remains zero-cost for MVP infrastructure.

### How It Works

```
User Input (Natural Language)
        │
        ▼
┌──────────────────────────┐
│  Intent Parser (LLM)     │
│  "Build a mobile app     │
│   with payments and AI"  │
│                          │
│  Extracted:              │
│  - Platform: Mobile      │
│  - Features: Payments,AI │
│  - Budget: Not specified │
│  - Skill: Not specified  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Clarification (if       │
│  needed — ask follow-up) │
│  "What's your budget?"   │
│  "React Native or        │
│   Flutter experience?"   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Category Mapper          │
│  Maps needs to tool       │
│  categories:              │
│  - Code Gen → Vibe Coding │
│  - Backend → BaaS         │
│  - AI → LLM API           │
│  - Payments → Deferred/OSS│
│  - Deploy → Hosting       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Vector Search (RAG)      │
│  For each category:       │
│  - Query vector DB with   │
│    user context           │
│  - Rank by score +        │
│    compatibility          │
│  - Filter by budget +     │
│    platform               │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Stack Assembler (LLM)    │
│  - Check compatibility    │
│  - Resolve conflicts      │
│  - Enforce user budget    │
│  - Generate reasoning     │
│  - Provide alternatives   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Response to User         │
│  - Primary stack          │
│  - Alternative stack      │
│  - Budget-fit breakdown   │
│  - Why each tool was      │
│    chosen                 │
│  - Getting started guide  │
└──────────────────────────┘
```

### Example Interactions

**Example 1: Build a Web App**
```
User: "I want to build a social media app like Twitter"

AI Response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Recommended Stack: Social Media App
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prototyping:    VS Code + Continue/Cline (open-source)
Framework:      Next.js 15 (App Router)
Database:       PostgreSQL + Redis (self-hosted)
File Storage:   MinIO (self-hosted)
Search:         PostgreSQL FTS or self-hosted Meilisearch
AI Features:    Ollama + open model (local inference)
Deployment:     Docker Compose (local/self-hosted VM)
CDN:            Optional free tier only
Analytics:      Umami (self-hosted)
Monitoring:     Uptime Kuma + Grafana

💰 Estimated Monthly Cost: $0 recurring
⚡ Time to MVP: ~3-5 weeks
```

**Example 2: AI Automation Workflow**
```
User: "I need to automate lead generation with AI"

AI Response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Recommended Stack: AI Lead Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scraping:       Playwright + Scrapy (self-hosted)
Enrichment:     Open datasets + custom scripts
AI Processing:  Ollama + open model
Automation:     n8n (self-hosted)
CRM:            ERPNext CRM or Mautic (self-hosted)
Email Outreach: SMTP + n8n workflows
Analytics:      Metabase (self-hosted)

💰 Estimated Monthly Cost: $0 recurring
⚡ Time to Setup: ~1-2 weeks
```

---

## 8. API Design

### Public REST API

```
BASE URL: https://api.aibrutal.com/v1
```

#### Tools

```
GET    /tools                    # List tools (paginated, filterable)
GET    /tools/:slug              # Get single tool details
GET    /tools/:slug/reviews      # Get reviews for a tool
GET    /tools/:slug/alternatives # Get alternative tools
GET    /tools/search?q=          # Full-text search
GET    /tools/trending           # Get trending tools
GET    /tools/new                # Recently added tools
POST   /tools/submit             # Submit a new tool (authenticated)
```

#### Categories

```
GET    /categories               # List all categories
GET    /categories/:slug/tools   # Tools in a category
```

#### Stack Recommender

```
POST   /recommend/stack          # Get AI tool stack recommendation
  Body: {
    "query": "I want to build a SaaS with AI features",
    "budget": "free",           // "free" | "low" | "medium" | "enterprise"
    "skill_level": "beginner",  // "beginner" | "intermediate" | "expert"
    "platform": "web",          // "web" | "mobile" | "desktop" | "all"
    "preferences": {
      "open_source": true,
      "self_hosted": true,
      "allow_paid_tools": true,
      "mix_free_and_paid": true
    }
  }

GET    /recommend/history        # User's past recommendations
```

#### Comparisons

```
GET    /compare?tools=a,b,c      # Compare up to 5 tools
```

#### User

```
POST   /auth/signup              # Create account
POST   /auth/login               # Login
GET    /user/profile              # Get user profile
PUT    /user/preferences          # Update preferences
GET    /user/bookmarks            # Get bookmarked tools
POST   /user/bookmarks/:tool_id  # Bookmark a tool
GET    /user/collections          # Get user collections
```

#### Analytics & Admin (Internal)

```
POST   /admin/tools/:id/score    # Update tool scores
POST   /admin/tools/:id/status   # Update tool status
POST   /admin/tools/bulk-update  # Bulk update tool data
GET    /admin/pipeline/status     # Check agent pipeline status
POST   /admin/agents/trigger      # Manually trigger an agent run
GET    /admin/metrics              # Platform-wide metrics
```

#### Real-Time (WebSocket)

```
WS     /ws/tools/feed             # Live feed of tool updates
WS     /ws/tools/:id/status       # Live status for a specific tool
WS     /ws/trending                # Live trending updates
```

---

## 9. Data Models

### Core Tables (PostgreSQL)

```sql
-- Tools catalog
tools
├── id (UUID, PK)
├── name (VARCHAR)
├── slug (VARCHAR, UNIQUE)
├── description_short (TEXT)
├── description_long (TEXT)
├── logo_url (VARCHAR)
├── website_url (VARCHAR)
├── pricing_model (ENUM: free, freemium, paid, enterprise)
├── pricing_details (JSONB)
├── platforms (TEXT[])          -- ['web', 'api', 'ios', 'android']
├── performance_score (INT)    -- 0-100
├── popularity_score (INT)     -- 0-100
├── value_score (INT)          -- 0-100
├── innovation_score (INT)     -- 0-100
├── specialization (TEXT)      -- "Best for rapid prototyping"
├── pros (TEXT[])
├── cons (TEXT[])
├── api_available (BOOLEAN)
├── open_source (BOOLEAN)
├── company (VARCHAR)
├── release_date (DATE)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── metadata (JSONB)           -- Flexible extra fields

-- Categories
categories
├── id (UUID, PK)
├── name (VARCHAR)
├── slug (VARCHAR, UNIQUE)
├── description (TEXT)
├── icon (VARCHAR)
├── parent_id (UUID, FK → categories)  -- Subcategories
└── sort_order (INT)

-- Tool-Category mapping (many-to-many)
tool_categories
├── tool_id (UUID, FK)
├── category_id (UUID, FK)
└── is_primary (BOOLEAN)

-- Tool integrations / compatibility
tool_integrations
├── tool_id (UUID, FK)
├── integrates_with_tool_id (UUID, FK)
└── integration_type (VARCHAR)  -- "native", "api", "plugin"

-- User reviews
reviews
├── id (UUID, PK)
├── tool_id (UUID, FK)
├── user_id (UUID, FK)
├── rating (INT)               -- 1-5
├── title (VARCHAR)
├── body (TEXT)
├── use_case (VARCHAR)
├── created_at (TIMESTAMP)
└── helpful_count (INT)

-- User bookmarks
bookmarks
├── user_id (UUID, FK)
├── tool_id (UUID, FK)
└── created_at (TIMESTAMP)

-- User collections
collections
├── id (UUID, PK)
├── user_id (UUID, FK)
├── name (VARCHAR)
├── description (TEXT)
└── is_public (BOOLEAN)

collection_tools
├── collection_id (UUID, FK)
├── tool_id (UUID, FK)
└── added_at (TIMESTAMP)

-- AI Recommendations log
recommendations
├── id (UUID, PK)
├── user_id (UUID, FK)
├── query (TEXT)
├── parsed_intent (JSONB)
├── result (JSONB)             -- Full stack recommendation
├── feedback (ENUM: helpful, not_helpful, null)
└── created_at (TIMESTAMP)

-- Tool update history
tool_update_log
├── id (UUID, PK)
├── tool_id (UUID, FK)
├── field_changed (VARCHAR)
├── old_value (TEXT)
├── new_value (TEXT)
├── source (VARCHAR)           -- "discovery_agent", "monitor_agent", "admin"
└── changed_at (TIMESTAMP)

-- Agent run history
agent_runs
├── id (UUID, PK)
├── agent_name (VARCHAR)
├── status (ENUM: running, success, failed)
├── started_at (TIMESTAMP)
├── completed_at (TIMESTAMP)
├── tools_processed (INT)
├── tools_added (INT)
├── tools_updated (INT)
└── error_log (TEXT)
```

### Vector Database (Qdrant Self-Hosted)

```
tool_embeddings
├── id (tool UUID)
├── vector (1536-dim)          -- Embedding of tool description + features
├── metadata
│   ├── name
│   ├── category
│   ├── pricing_model
│   ├── platforms
│   ├── scores
│   └── tags
```

---

## 10. Tech Stack Recommendation (Zero-Cost Implementation)

### Frontend
| Layer | Technology | Why |
|-------|-----------|-----|
| Web | React + Vite | Already in use, fast DX |
| Mobile | React Native (Expo) | Shared React knowledge, single codebase |
| Desktop | Tauri | Lightweight, Rust-based, cross-platform |
| State | Zustand / TanStack Query | Lightweight, React-native compatible |
| UI Library | Tailwind CSS + shadcn/ui | Consistent design, fast styling |
| Real-Time | Socket.io client | WebSocket for live updates |

### Backend
| Layer | Technology | Why |
|-------|-----------|-----|
| Primary API | Node.js + Fastify | Fast, TypeScript, matches frontend |
| AI Services | Python + FastAPI | Best AI/ML ecosystem |
| Auth | Keycloak / Authentik (self-hosted) | Open-source auth, no recurring fee |
| Database | PostgreSQL (self-hosted) | Reliable and free |
| Cache | Redis | Fast caching, pub/sub for realtime |
| Search | PostgreSQL FTS / Meilisearch (self-hosted) | Free full-text search |
| Vector DB | Qdrant (self-hosted) | Tool similarity + RAG at zero recurring cost |
| Queue | BullMQ (Redis-backed) | Job scheduling, agent task queue |
| File Storage | MinIO (self-hosted) | S3-compatible, free |

### AI/ML
| Layer | Technology | Why |
|-------|-----------|-----|
| LLM | Ollama + open models (Llama/Mistral/Qwen) | Zero recurring cost local inference |
| Agent Framework | CrewAI or LangGraph | Multi-agent orchestration |
| Embeddings | sentence-transformers (local) | Free local embedding pipeline |
| Web Scraping | Playwright + Scrapy | JS-rendered + static sites |
| NLP | spaCy | Review sentiment analysis |

### Infrastructure
| Layer | Technology | Why |
|-------|-----------|-----|
| Hosting (API) | Local machine / self-hosted VPS | Zero recurring cost path |
| Hosting (Web) | GitHub Pages / Cloudflare Pages (free) | Free web hosting |
| Hosting (AI) | Local CPU/GPU via Ollama | No paid inference endpoint |
| CDN | Optional free tier only | Not required for MVP |
| Monitoring | Uptime Kuma + Prometheus + Grafana | Open-source monitoring |
| CI/CD | GitHub Actions | Automated testing + deployment |

---

## 11. Zero-Cost Implementation Policy

- MVP must operate with **$0 recurring cost**.
- Any feature requiring paid SaaS/API is deferred to post-MVP.
- Recommendations for **implementation stacks** must default to free/open-source/self-hosted tools.
- For **app tool recommendations**, the system may return paid + free tools according to user budget preference.
- If a paid tool is suggested, include at least one free alternative when available.

---

## 12. Roadmap

### Phase 1 — Foundation (Month 1-2)
- [ ] Set up PostgreSQL schema and seed 500+ tools manually + scraped
- [ ] Build Core API (CRUD for tools, search, categories)
- [ ] Implement auth with Keycloak/Authentik (self-hosted)
- [ ] Build web frontend — browse, search, filter tools
- [ ] Deploy web version on free hosting (GitHub Pages / Cloudflare Pages free)

### Phase 2 — AI Agents (Month 3-4)
- [ ] Build Discovery Agent (auto-find new tools)
- [ ] Build Evaluation Agent (auto-score tools)
- [ ] Build Content Agent (auto-generate descriptions)
- [ ] Set up self-hosted Qdrant and local embeddings for all tools
- [ ] Build basic Stack Recommender (v1)
- [ ] Reach 1000+ tools

### Phase 3 — Real-Time & Intelligence (Month 5-6)
- [ ] Build Monitoring Agent (uptime, pricing changes)
- [ ] Build Trend Agent (social media tracking)
- [ ] Implement WebSocket real-time updates
- [ ] Build Comparison Agent
- [ ] Enhance Stack Recommender with follow-up questions
- [ ] Add user reviews system

### Phase 4 — Cross-Platform (Month 7-8)
- [ ] Build React Native mobile app (iOS + Android)
- [ ] Build Tauri desktop app (macOS + Windows + Linux)
- [ ] Implement push notifications
- [ ] Add offline mode for browsing cached tools

### Phase 5 — Growth (Month 9-12)
- [ ] Build User Profile Agent (personalization)
- [ ] Launch public API
- [ ] Optimize zero-cost operations for scale (caching, queueing, batch scoring)
- [ ] Build tool maker dashboard
- [ ] Reach 3000+ tools
- [ ] Community features (forums, shared stacks)

### Phase 6 — Scale (Month 12+)
- [ ] Advanced AI: voice-based stack recommendations
- [ ] Plugin marketplace (community-built agents)
- [ ] Tool analytics API (for market researchers)
- [ ] Reach 5000+ tools
- [ ] International localization

---

## Summary

**AI Brutal** is an AI-native platform that becomes the **definitive source of truth** for AI tools. It combines:

- **Scale** — Thousands of tools, continuously growing
- **Intelligence** — Multi-agent system that autonomously discovers, evaluates, and recommends tools
- **Real-Time** — Always up-to-date with live monitoring and instant updates
- **Cross-Platform** — Available everywhere: web, mobile, desktop
- **Personalization** — Learns what you need and surfaces the right tools
- **Stack Building** — The killer feature — tell it what you want to build, get a complete tool stack
- **Zero-Cost Implementation** — Project plans and recommended implementation stacks prioritize $0 recurring-cost paths

The multi-agent backend is the competitive moat — no human team can manually track thousands of AI tools across pricing, performance, compatibility, and trends. The agents do it 24/7, automatically.
