# Design System: AI BRUTAL

**Project ID:** ai-brutal-2026  
**Purpose:** AI Tool Comparison & Recommendation Platform  
**Target Users:** Non-technical & technical users seeking AI tools for their workflow

---

## 1. Visual Theme & Atmosphere

**Vibe:** Neo-Brutalist, Bold, Authoritative, Accessible

The interface embraces a **deliberate, raw aesthetic** with:
- **High-contrast monochromatic foundation** (pure black `#111111` on paper white `#ffffff`)
- **Aggressive geometric forms** with thick 3–4px borders and hard-edged drop shadows
- **Vibrant accent spectrum** for functional roles and category distinction
- **Transparent, honest layout** that prioritizes clarity and usability for both rural/non-technical and power users
- **Flat, elevated, and inset shadow treatments** for depth without gloss

**Philosophy:** Remove the noise. Respect user time. Make every interaction intentional.

---

## 2. Color Palette & Roles

### Primary Foundation
| Color Name | Hex Code | Role |
|---|---|---|
| **Pure Black** | `#111111` | Primary structural element, borders, shadows, strong emphasis |
| **Pure White** | `#ffffff` | Contrast, text on dark, positive space |
| **Paper Light** | `#f8fbff` | Default page background, neutral containers |

### Functional Accents
| Color Name | Hex Code | Role |
|---|---|---|
| **Signal Blue** | `#3b82f6` | Primary actions, active states, focus indicators, trusted affordances |
| **Deep Purple** | `#6d28d9` | Secondary emphasis, interactive elements, premium/featured |
| **Clear Yellow** | `#fde047` | Warnings, alerts, high-visibility highlights |
| **Soft Pink** | `#fb7185` | Deletions, errors, user cautions |
| **Action Orange** | `#fb923c` | Calls-to-action, complementary emphasis |
| **Lime Green** | `#84cc16` | Success states, positive confirmations |
| **Cyan Bright** | `#06b6d4` | Information, secondary highlights, links |
| **Muted Red** | `#ef4444` | Critical errors, destructive actions |

### Semantic Surfaces
| Name | Hex Code | Usage |
|---|---|---|
| **Surface** | `#eff6ff` | Elevated containers, card backgrounds |
| **Ink** | `#1f2937` | Secondary text, muted content |

---

## 3. Typography Rules

### Font Stack
- **Display Headlines:** `Syne`, sans-serif (800 weight)
- **Body Content:** `DM Sans`, sans-serif (400–600 weight)
- **Monospace Code/Technical:** `JetBrains Mono`, monospace (400–700 weight)

### Type Scale
- **Page Headers (Section headings):** Clamp from 2.2rem to 3.8rem, bold (800), tight leading (1.05)
- **Subheadings:** 1.25–1.5rem, semi-bold (600–700)
- **Body Text:** 0.95–1rem, regular (400), relaxed leading (1.5)
- **Small Text (metadata, labels):** 0.75–0.88rem, regular (400)
- **Micro (hints, tags):** 0.65–0.75rem, mono weight

### Character
- Tight letter-spacing on headlines (-0.03em to -0.02em)
- Generous line-height on body (1.5–1.65)
- All-caps labels in display font for hierarchy

---

## 4. Component Stylings

### Buttons & CTAs
- **Shape:** Subtly rounded (4–8px) or sharp edges (0px) depending on context
- **Style:** 3px solid black border + hard drop shadow (6px 6px 0 black)
- **Primary Action:** Blue (#3b82f6) background + white text + black outline
- **Secondary:** Transparent + black text + black border
- **Hover:** Lift shadow effect (reduce offset), slight color brightening
- **Active/Focus:** 2px inset shadow effect, strong color saturation

### Cards & Containers
- **Border:** 3–4px solid black outline
- **Corner Roundness:** 4–12px for softer experience OR sharp (0px) for brutalist effect
- **Shadow:** 6px 6px 0px black (offset drop) OR 6px 6px 12px rgba(17,17,17, 0.14) (soft)
- **Background:** Paper white or surface light blue
- **Padding:** 24–40px clamp scaling
- **Hover:** Shadow lift (12px 12px 0), slight scale (+2%), sustained border strength

### Inputs & Forms
- **Stroke:** 3px solid black border
- **Background:** Paper white or surface light
- **Focus State:** 3px solid signal-blue (#3b82f6) border + inset shadow
- **Placeholder:** Muted gray (Ink #1f2937, 50% opacity)
- **Label:** Display font, 0.85rem, semi-bold

### Navigation & Tabs
- **Active State:** Signal-blue underline or background fill
- **Inactive:** Black text, transparent background
- **Hover:** Purple (#6d28d9) accent or slight background shift
- **Mobile:** Hamburger menu icon + slide-out sidebar (full-width, black background)

### Data Tables & Comparison
- **Header Row:** Black background + white text + bold display font
- **Body Rows:** Alternating paper white and surface blue backgrounds
- **Column Divider:** 2–3px black border
- **Row Hover:** Subtle shadow lift + background brightening
- **Sortable Headers:** Purple icon chevron on hover

### Real-Time Indicators
- **Status Badge:** 8×8px circle (green for live, yellow for syncing, red for offline)
- **Pulse Animation:** 2-second glow ring on active real-time feeds
- **Tooltip:** Black background + white text, 2px border, 4px padding

---

## 5. Layout Principles

### Spacing & Grid
- **Section Padding:** Clamp from 60px to 120px vertical, 20px to 60px horizontal
- **Gutter Width:** 40–60px between major sections
- **Card Grid:** 3–4 columns on desktop, responsive stack on mobile
- **Baseline Grid:** 8px for consistent rhythm

### Whitespace Strategy
- **Generous above fold:** Use white space to guide attention
- **Dense content zones:** Group related items with reduced padding (8–16px)
- **Visual breathing room:** 24–40px margins between distinct sections
- **Mobile:** Reduce padding by 30–40%, maintain vertical rhythm

### Alignment & Hierarchy
- **Text:** Left-aligned body, center-aligned titles
- **Cards:** Left-aligned content within cards
- **CTA Buttons:** Center-aligned at section close or inline right-aligned
- **Mobile:** Full-width buttons, centered headers

---

## 6. Key Pages & Workflows

### Home Page
- **Header:** Sticky navbar (glass + blur effect optional, black background + white text)
- **Hero:** Large headline (3.2rem+), short subtitle, primary CTA button
- **Feature Section:** 3–4 feature cards with icons + 200 chars description
- **Comparison Teaser:** Quick 3-tool side-by-side comparison card
- **Call-to-Action:** "Start Comparing" button (Signal Blue)
- **Footer:** Mirrored design system colors (blue accent on paper background)

### Tools Explore Page
- **Filter Bar:** Horizontal pills (categories, pricing tier, integration count)
- **Grid View:** Responsive card grid, 3–4 columns
- **Card Content:** Tool logo/icon, name, 80-char description, price badge, "View" button
- **Real-Time Badge:** Green live indicator + "Last updated: 2m ago"
- **Mobile:** Full-width cards, simplified filter sticky header

### Comparison Page
- **Header:** "Compare Tools" + subtitle
- **Table Wrapper:** Horizontally scrollable on mobile
- **Feature Row:** Feature label (left sticky) + tool values (per column)
- **Pros/Cons Section:** Expandable details per tool
- **Add More Tools:** "+ Add Another" button at table end
- **Remove Option:** X icon in each tool column header

### Stack Builder (Recommendation Page)
- **Input Section:** Large text area + voice input icon + "Analyze" button
- **Recommendation Results:**
  - **Stack Recommendation** card (4–6 tools ranked by score)
  - **Separate AI Tools** card (2–3 specialized recommendations)
  - **Source Badge:** "Backend AI" vs "Local Fallback"
  - **Real-Time Pulse:** Active indicator during processing
- **Mobile:** Full-width inputs, stacked result cards

### Collections Page
- **Header:** "My Collections" + create button
- **Collection Cards:** Title, item count, last modified date, action menu
- **Edit Mode:** Checkbox + bulk actions
- **Detail View:** Tool grid within collection, add/remove controls

---

## 7. Animation & Micro-interactions

### Transitions
- **Page Entry:** 200ms fade-in + subtle 20px slide-up
- **Button Hover:** 150ms shadow lift + color brightening
- **Card Hover:** 150ms scale (102%) + shadow expansion
- **Loading:** Spinner overlay with transparent dark background

### Real-Time Animations
- **Feed Update:** 400ms pulse glow on new item
- **Live Indicator:** 2-second breathing pulse on active status
- **Notification Toast:** Slide-in from top-right, auto-dismiss after 5s

### Keyboard Navigation
- Tab order: Logo → Nav Links → Primary CTA → Cards → Footer
- Focus rings: 3px blue border + shadow
- Skip links: Hidden until focused, visible on keyboard nav

---

## 8. Responsive Breakpoints

| Screen Size | Layout Adjustment |
|---|---|
| **Mobile (0–640px)** | Single column, full-width buttons, sticky header, bottom nav |
| **Tablet (641–1024px)** | 2–3 cols, clipped padding, side drawer nav |
| **Desktop (1025px+)** | Full 3–4 cols, max-width 1200px, horizontal nav |

---

## 9. Accessibility & Inclusivity

### Color Contrast
- All text: Min WCAG AA (4.5:1 for body, 3:1 for large text)
- Interactive elements: Min 3:1 against background
- Non-color-only indicators: Always paired with text/icons

### Touch Targets
- Minimum 44×44px for all clickable elements
- 12px min padding on mobile for clarity

### Keyboard Support
- Full keyboard navigation (Tab, Enter, Esc)
- Focus indicators on all interactive elements
- Screen reader labels on icons and buttons

### Voice Input Support
- Microphone icon on Stack Builder for speech recognition
- Haptic feedback (vibration) on mobile for voice activation
- Clear status labels: "Listening...", "Processing...", "Ready"

---

## 10. Design Tokens (CSS Variables)

```css
/* Core Palette */
--black: #111111;
--white: #ffffff;
--paper: #f8fbff;
--ink: #1f2937;

/* Accents */
--accent: #3b82f6;
--purple: #6d28d9;
--yellow: #fde047;
--pink: #fb7185;
--blue: #3b82f6;
--lime: #84cc16;
--orange: #fb923c;
--red: #ef4444;
--cyan: #06b6d4;

/* Surfaces */
--surface: #eff6ff;
--signal: #1d4ed8;

/* Borders & Shadows */
--border: 3px solid var(--black);
--border-thick: 4px solid var(--black);
--shadow: 6px 6px 0 var(--black);
--shadow-lg: 12px 12px 0 var(--black);
--shadow-soft: 6px 6px 12px rgba(17, 17, 17, 0.14);

/* Typography */
--font-display: 'Syne', sans-serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing */
--section-pad: clamp(60px, 8vw, 120px) clamp(20px, 4vw, 60px);
```

---

## 11. Implementation Checklist

- [x] Color palette applied to all pages
- [x] Real-time indicators integrated (live badge + pulse)
- [x] Comparison page with full feature matrix
- [x] Recommendation engine (backend + fallback)
- [x] Voice input on Stack Builder
- [x] Curated categories and filtering
- [x] Tool logos and icons
- [ ] **Footer color aligned to main interface design** ← *IN PROGRESS*
- [x] Offline support + sync indicators
- [x] Lint validation (all rules passing)
- [x] Production build verification
- [ ] Mobile responsive audit (final sweep)
- [ ] Accessibility audit (WCAG AA compliance)

---

## 12. Next Steps for Final Delivery

1. **Update Footer Colors:** Change from black to paper/white with accent blue elements
2. **Mobile Audit:** Verify 44×44px touch targets and responsive layouts
3. **Real-time Testing:** End-to-end flow with backend API
4. **Performance:** Lazy load images, code split routes, minify assets
5. **Launch:** Deploy to production with analytics
