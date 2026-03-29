# AI Brutal — Design System
**Platform:** Web + Mobile + Desktop (Cross-Platform)  
**Philosophy:** Simple, Clean, Inclusive — Designed for everyone, not just tech experts

---

## 🎯 Core Design Principles

1. **Clarity Over Complexity** — Every element should have a clear purpose
2. **Inclusive Design** — Works for non-tech users who don't understand AI terminology
3. **Progressive Disclosure** — Show simple options first, advanced features on demand
4. **Mobile-First** — Design for small screens first, scale up
5. **Accessibility** — WCAG AA compliant, clear contrast, large touch targets
6. **Consistency** — Unified language, spacing, and components across all platforms

---

## 🎨 Visual Language

### Atmosphere
**Clean, Approachable, Modern, Minimalist**
- Bright, open whitespace
- Gentle, human-friendly design
- No overwhelming visuals
- Clear information hierarchy
- Subtle depth, minimal shadows

### Color Palette

| Color | Hex | Role | Usage |
|-------|-----|------|-------|
| **Primary Blue** | #3B82F6 | Main action, Links | "Get Started", "Explore", Primary CTAs |
| **Success Green** | #10B981 | Positive feedback, Free tier | "Free", "Available", Success states |
| **Warm Amber** | #F59E0B | Warnings, Premium | "Premium", "New", Attention-grabbing |
| **Neutral Dark** | #1F2937 | Text, Headers | Headlines, body text |
| **Neutral Light** | #F9FAFB | Backgrounds | Page background, cards |
| **Neutral Gray** | #6B7280 | Secondary text | Descriptions, helper text |
| **Light Gray** | #E5E7EB | Borders, Dividers | Subtle separators |

### Typography

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| **Headline 1** | System Stack | 32px (mobile) / 48px (desktop) | 700 Bold | Page titles, Hero headline |
| **Headline 2** | System Stack | 24px (mobile) / 32px (desktop) | 600 Semi-bold | Section titles |
| **Headline 3** | System Stack | 18px | 600 Semi-bold | Card titles, subsections |
| **Body** | System Stack | 14px (mobile) / 16px (desktop) | 400 Regular | Paragraphs, descriptions |
| **Small** | System Stack | 12px | 400 Regular | Helper text, timestamps |
| **Button** | System Stack | 14px (mobile) / 16px (desktop) | 600 Semi-bold | All interactive elements |

**Font Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

### Spacing & Rhythm

```
Base Unit: 8px (multiples of 8)

Padding/Margin Scale:
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px
```

### Border Radius

| Element | Radius | Description |
|---------|--------|-------------|
| **Buttons** | 6px | Subtle, soft corners |
| **Cards** | 8px | Slightly more rounded |
| **Inputs** | 6px | Consistent with buttons |
| **Modals** | 12px | Friendly, approachable |
| **Badges** | 4px | Small, compact |

### Shadows & Depth

- **Flat Design** — No shadows by default (clean, minimal)
- **Hover State** — Subtle lift: `0 4px 12px rgba(0,0,0,0.08)`
- **Card Elevation** — Whisper-soft: `0 2px 8px rgba(0,0,0,0.05)`
- **Modal/Overlay** — Prominent but not harsh: `0 20px 25px rgba(0,0,0,0.15)`

---

## 📱 Layout Grid

### Mobile (< 768px)
- **Columns:** 1 column, full width with safe margins (12px padding)
- **Breakpoint:** Base layout

### Tablet (768px - 1024px)
- **Columns:** 2 columns
- **Max Width:** 100% (minus safe margins)
- **Breakpoint:** Medium layout

### Desktop (> 1024px)
- **Columns:** 3+ columns
- **Max Width:** 1200px (centered)
- **Breakpoint:** Large layout

---

## 🧩 Component System

### Buttons

**Primary Button** (Main actions)
- Background: Primary Blue (#3B82F6)
- Text: White
- Padding: 10px 20px
- Border Radius: 6px
- Font Weight: 600
- Hover: Darker blue, subtle shadow
- States: Default, Hover, Active, Disabled

**Secondary Button** (Alternative actions)
- Background: Transparent
- Border: 1px Light Gray (#E5E7EB)
- Text: Neutral Dark (#1F2937)
- Padding: 10px 20px
- Hover: Light gray background

**Text Button** (Navigation, links)
- No background, no border
- Text: Primary Blue (#3B82F6)
- Hover: Underline
- Font Weight: 600

### Input Fields

- **Height:** 40px
- **Padding:** 10px 12px
- **Border:** 1px Light Gray (#E5E7EB)
- **Border Radius:** 6px
- **Focus:** Blue border (#3B82F6), soft shadow
- **Placeholder:** Neutral Gray (#6B7280)
- **Font Size:** 14px (mobile) / 16px (desktop)

### Cards

- **Background:** White (#FFFFFF)
- **Border:** 1px Light Gray (#E5E7EB)
- **Padding:** 16px (mobile) / 20px (desktop)
- **Border Radius:** 8px
- **Shadow:** Subtle elevation (hover state)
- **Spacing Between Cards:** 16px

### Navigation / Header

- **Height:** 56px (mobile) / 64px (desktop)
- **Background:** White (#FFFFFF) with subtle border
- **Logo:** 24px x 24px (mobile) / 32px x 32px (desktop)
- **Menu:** Hamburger on mobile, horizontal on desktop
- **Search Bar:** Collapsed on mobile, visible on desktop
- **Sticky:** Stays at top when scrolling

### Hero Section

- **Height:** 240px (mobile) / 400px (desktop)
- **Background:** Soft gradient (Primary Blue to lighter shade)
- **Text Alignment:** Center
- **Headline:** Large, clear, non-technical
- **Subheadline:** Smaller, explains value
- **CTA Button:** Primary blue, centered, 48px height

### Tool Card

- **Width:** Full on mobile, 1/2 on tablet, 1/3 on desktop
- **Height:** Auto
- **Content:**
  - Icon/Logo (48x48px)
  - Tool Name (H3)
  - Short Description (2 lines, truncated)
  - Category Badge
  - Pricing Badge
  - 1-2 Quick Action Buttons
- **Interactive:** Hover lifts card, reveals more details
- **Padding:** 16px

### Filter/Search Bar

- **Position:** Sticky below header on mobile, sticky sidebar on desktop
- **Width:** Full on mobile, fixed width on desktop (280px)
- **Search Input:** Full width
- **Filters:** Expandable categories, collapsible on mobile
- **Clear Filters Btn:** Prominent, easy to find

### Recommendation Section (Stack Builder)

- **Layout:** Conversational, step-by-step
- **Input Style:** Large textarea, comfortable to write in
- **Output:** Card-based stack with:
  - Tool name
  - Why it's recommended (short reason)
  - Link to details
  - "Swap for alternative" button
- **Mobile-Friendly:** Stack vertically, one tool per row
- **Desktop-Friendly:** Grid layout, multiple tools across

### Footer

- **Background:** Neutral Light (#F9FAFB)
- **Border-Top:** 1px Light Gray (#E5E7EB)
- **Content:** Links, copyright, social links
- **Mobile:** Single column, full width
- **Desktop:** Multiple columns, organized

---

## 🎭 Interaction Patterns

### Hover States
- Subtle background color change (Neutral Light #F9FAFB)
- Soft shadow elevation (0 4px 12px rgba(0,0,0,0.08))
- Scale slightly (1.02x) for cards only

### Click/Active States
- Darker background
- No scale (prevents accidental double-clicks)

### Loading States
- Skeleton screens for content areas
- Pulsing animation (3-second cycle)
- No spinners (simpler, more approachable)

### Empty States
- Friendly illustration
- Clear, helpful message (non-technical)
- CTA to take action (browse, explore, create)

### Error States
- Red highlight on inputs (#EF4444)
- Clear, helpful error message in plain English
- Suggestion for how to fix it

---

## 📐 Responsive Breakpoints

```css
/* Mobile First Approach */
mobile:     0px   /* Default */
tablet:     768px /* iPad, landscape phones */
desktop:    1024px /* Desktop, large screens */
wide:       1440px /* Ultra-wide monitors */
```

### Mobile-First Guidelines
1. **Single Column Layout** — Stack everything vertically
2. **Large Touch Targets** — Minimum 44px height/width for buttons
3. **Simplified Navigation** — Hamburger menu, reduced options
4. **Bottom Navigation** (Optional) — For key actions
5. **Full-Width Cards** — Use entire screen width minus padding

### Desktop Enhancements
1. **Multi-Column Layouts** — Utilize horizontal space
2. **Sidebar Navigation** — More options visible
3. **Hover Interactions** — Reveal more details
4. **Keyboard Shortcuts** — Power users can use them

---

## 🔤 Voice & Tone

### Language Principles
- **Simple:** Avoid AI jargon (no "LLM", "training data", "inference")
- **Friendly:** Warm, approachable, like talking to a friend
- **Clear:** Specific, no marketing fluff
- **Inclusive:** Assumes no technical background

### Example Language

❌ **Don't:** "Utilize advanced LLM-powered stack recommendation engine"
✅ **Do:** "I'll help you find the perfect tools for what you want to build"

❌ **Don't:** "Leverage API endpoints for real-time data ingestion"
✅ **Do:** "Integrates with your favorite tools"

❌ **Don't:** "Deploy containerized microservices"
✅ **Do:** "Set up in minutes"

---

## 🎬 Page Flows

### Key User Journeys

#### Journey 1: Browse Tools (Casual User)
```
Homepage (Hero + Browse)
    ↓
Tools Grid (Browse by category)
    ↓
Tool Details (View full info)
    ↓
Save/Share
```

#### Journey 2: Find Stack (Builder)
```
Homepage
    ↓
"What do you want to build?" (Simple text input)
    ↓
AI asks clarifying questions (3-5 interactive questions)
    ↓
Recommended Stack (5-8 tools in a clean layout)
    ↓
Save Stack / Share
```

#### Journey 3: Search & Filter (Goal-Oriented)
```
Homepage
    ↓
Search Bar ("Find tools for...")
    ↓
Instant Results (Tools, categories, stacks)
    ↓
Refine (Filter by pricing, platform, etc.)
    ↓
Save Favorites / Create Collection
```

---

## ✨ Special Features & Animations

### Micro-Interactions
- **Button Hover:** Subtle bounce (0.2s)
- **Card Hover:** Soft lift effect (0.3s)
- **Loading:** Gentle pulse animation
- **Success:** Quick flash + checkmark (0.5s)
- **Toast Notifications:** Slide in from bottom (mobile) / top-right (desktop)

### Page Transitions
- **Fade:** For modal overlays
- **Slide:** For sidebars, drawers
- **Scale:** For expanding cards
- **Fade + Slide:** For page changes (subtle, not distracting)

---

## 📋 Accessibility (WCAG AA)

- **Color Contrast:** Minimum 4.5:1 for text on backgrounds
- **Touch Targets:** Minimum 44px x 44px for buttons
- **Focus Indicators:** Visible 2px outline in Primary Blue
- **Form Labels:** Always associated with inputs
- **Alt Text:** For all images and icons
- **Keyboard Navigation:** All interactions possible via Tab + Enter
- **Screen Readers:** Proper semantic HTML, ARIA labels where needed
- **Font Size:** Minimum 14px for body text
- **Line Height:** 1.5 or greater for readability

---

## 🚀 Implementation Notes

### CSS Framework
- **Tailwind CSS 3.0+** — Utility-first styling
- **CSS Variables** — For brand colors, spacing, fonts
- **Responsive Classes** — Mobile-first breakpoints (sm:, md:, lg:)

### Component Library
- **shadcn/ui** — Pre-built, accessible components
- **Radix UI** — Unstyled, accessible primitives
- **Custom Components** — Minimal custom code, leverage libraries

### Typography
- **System Fonts** — Faster loading, familiar feel
- **Font Sizes** — Base 16px, scale: 12px, 14px, 16px, 18px, 24px, 32px, 48px
- **Font Weights** — 400 (regular), 600 (semi-bold), 700 (bold)

### Icons
- **Icon Set** — Heroicons (simple, clean, 24px default)
- **Usage** — 24px for UI actions, 32px for empty states
- **Color:** Neutral Dark for primary, Neutral Gray for secondary

---

## 📱 Platform-Specific Considerations

### Web (Browser)
- **Full navigation** — All features accessible
- **Keyboard shortcuts** — For power users
- **Desktop layout** — Optimized for 1024px+
- **Progressive enhancement** — Works without JavaScript

### Mobile (iOS/Android/React Native)
- **Bottom navigation** — Key actions at thumb-friendly location
- **Large touch targets** — 48px minimum
- **Simplified UI** — Hide advanced options by default
- **Native feel** — Respect platform conventions (iOS vs Android)

### Desktop (Electron/Tauri)
- **Window controls** — Native OS buttons
- **Menu bar** — File, Edit, View, Help (macOS-style)
- **Fullscreen support** — Optimized for large displays
- **Drag and drop** — File import/export

---

## 🎯 Summary

This design system enables:
- ✅ **Simplicity** — No cognitive overload
- ✅ **Accessibility** — Works for everyone
- ✅ **Consistency** — Same experience across platforms
- ✅ **Friendliness** — Warm, approachable tone
- ✅ **Scalability** — Easy to add new features
- ✅ **Performance** — Clean, fast, minimal
