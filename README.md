# 🤖 AI BRUTAL – Production-Ready AI Tool Comparison & Recommendation Platform

> A **neo-brutalist**, **real-time** platform for discovering, comparing, and recommending AI tools. Built for both technical and non-technical users seeking AI solutions.

![Build Status](https://img.shields.io/badge/build-✅%20passing-green)
![Lint Status](https://img.shields.io/badge/lint-✅%20passing-green)
![Status](https://img.shields.io/badge/status-🚀%20production%20ready-blue)

---

## 📖 Quick Links

- **[Complete Project Guide](COMPLETE_PROJECT_GUIDE.md)** – Full feature documentation, workflows, API reference
- **[Design System](./stitch/DESIGN.md)** – Colors, typography, components, and styling specifications
- **[Project Status](PROJECT_STATUS.md)** – Implementation checklist and validation results

---

## ✨ Core Features

### 🎯 **Comparison** – Side-by-Side Feature Matrix
- Compare 2+ AI tools simultaneously
- Feature rows: Pricing, Free Tier, Setup Time, Integrations, Support
- Expandable Pros/Cons for each tool
- Remove tools to narrow focus
- Responsive on all devices

### 🧠 **AI Recommendations** – Intelligent Tool Suggestions
- **Natural Language Input:** Paste requirements or use voice input
- **Backend-Powered:** FastAPI endpoint analyzes needs
- **Dual Results:**
  - Stack Recommendation (4–6 tools ranked by fit)
  - Separate AI Tools (2–3 specialized recommendations)
- **Transparency:** Source labels show "Backend AI" vs "Local Fallback"
- **Voice Input:** Browser speech recognition support

### ⚡ **Real-Time Features** – Live Data Sync
- Status badges showing data freshness
- "Last updated: Xm ago" on tool cards
- Live pulse indicator during processing
- Offline cache with sync detection
- Real-time tool database updates

### 🎨 **Neo-Brutal Design** – Bold, Accessible Interface
- High-contrast monochromatic foundation
- Thick 3–4px borders with hard shadows
- Vibrant accent colors (blue, purple, yellow, pink)
- Large touch targets (44×44px minimum)
- Consistent across all pages, **including footer** ✅

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (frontend)
- Python 3.9+ (backend)
- npm or yarn

### 1. Install Frontend
```bash
cd ai-brutal
npm install
```

### 2. Set Up Backend
```bash
# Install Python dependencies
npm run api:install

# Bootstrap database
npm run api:db:bootstrap

# Start API server (runs on http://127.0.0.1:4002)
npm run api:dev
```

### 3. Set Environment
Create `.env.local` in `ai-brutal/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:4002
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-public-key
```

### 4. Start Dev Server
```bash
npm run dev
# Open http://localhost:5173
```

---

## 📂 Project Structure

```
ai-brutal/
├── .stitch/DESIGN.md ..................... Design system documentation
├── src/
│   ├── pages/ ........................... Route components (Home, Tools, Build, Comparison, Collections)
│   ├── components/ ....................... UI components (Navbar, Footer, ToolCard, etc.)
│   ├── lib/apiClient.js ................. Backend API integration + recommendation engine
│   ├── hooks/useRealtimeTools.js ........ Real-time sync hook
│   ├── index.css ........................ Global design tokens
│   └── main.jsx ........................ Entry point
├── backend/
│   ├── app/main.py ..................... FastAPI endpoints
│   ├── app/catalog_service.py .......... AI recommendation algorithm
│   └── requirements.txt ................ Python dependencies
├── COMPLETE_PROJECT_GUIDE.md ........... Full documentation
└── PROJECT_STATUS.md .................. Implementation checklist
```

---

## 🎯 Main Workflows

### **Discover Tools**
Home → Explore Tools → Browse/Search → View Details

### **Get Recommendations**
Build Stack → Describe Requirement (text or voice) → View Stack + Separate Tools

### **Compare Tools**
Select Tools → Comparison Page → View Feature Matrix → Read Pros/Cons

### **Save Collections**
Heart Icon on Tools → Create Collection → Manage in Collections Page

---

## 🔧 Technology Stack

- **Frontend:** React 19, Vite, React Router 7
- **Styling:** Custom CSS with neo-brutal design tokens
- **Real-Time:** SSE (Server-Sent Events), IndexedDB offline cache
- **Voice:** Browser Web Speech API
- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

---

## 🎨 Design Highlights

### Footer Color Sync ✅
- **Background:** Paper white (`#f8fbff`) – matches main interface
- **Text:** Black ink (`#1f2937`)
- **Accents:** Signal blue (`#3b82f6`) buttons and links
- **Border:** 4px solid blue top border
- **Style:** Neo-brutal with black borders and shadows

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Primary | Black | `#111111` |
| Background | Paper | `#f8fbff` |
| Action | Signal Blue | `#3b82f6` |
| Secondary | Purple | `#6d28d9` |
| Success | Lime | `#84cc16` |
| Error | Pink | `#fb7185` |

### Typography
- **Display:** Syne (800 weight, tight tracking)
- **Body:** DM Sans (400–600 weight)
- **Mono:** JetBrains Mono (code)

---

## ✅ Quality Assurance

```bash
# Build check (143 modules, ~240KB gzip)
npm run build
✅ PASS

# Lint validation (ESLint)
npm run lint
✅ PASS (0 errors)

# Preview production build
npm run preview
```

**All routes return 200:**
- ✅ Home (/)
- ✅ Tools (/tools)
- ✅ Build Stack (/build)
- ✅ Comparison (/compare)
- ✅ Collections (/collections)

---

## 🔐 Features

- **AI-Powered Recommendations** – Backend endpoint analyzes requirements
- **Voice Input** – Speak requirements, get recommendations
- **Real-Time Sync** – Live tool database updates with status indicators
- **Offline Support** – Cache tools, sync when online
- **Mobile Responsive** – Bottom nav, touch-friendly, full-width cards
- **Collections** – Save and organize favorite tools
- **Accessibility** – 44×44px touch targets, high contrast, keyboard navigation
- **Zero Configuration** – Works with or without Supabase (local fallback)

---

## 📊 API Reference

### Stack Recommendation Endpoint
```
POST /v1/recommend/stack
Body: { requirement, budget, categories, max_items }
Response: { stack, separate_ai_tools, source }
```

See [COMPLETE_PROJECT_GUIDE.md](COMPLETE_PROJECT_GUIDE.md) for full API docs.

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

### Backend (Railway/Heroku)
```bash
git push heroku main
```

---

## 📖 Documentation
npm run dev
```

For push subscription setup in the browser, add to frontend `.env`:

```bash
VITE_WEB_PUSH_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
```

## Run Backend

```bash
npm run api:install
npm run api:dev
```

Backend URL: `http://localhost:4002`

### Minimal zero-cost local start

1. Start backend with default local setup (no DB required):

```bash
npm run api:install
npm run api:dev
```

2. Start frontend:

```bash
npm install
npm run dev
```

This mode is fully zero-cost and supports public app flows.

### Zero-cost preflight check

Run this before starting services to verify your env is still aligned with zero-cost mode:

```bash
npm run api:preflight:zerocost
```

## Blueprint Execution Report

Execution details are documented in:

- `IMPLEMENTATION_EXECUTION_REPORT.md`

