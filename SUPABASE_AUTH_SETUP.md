# Supabase Full Backend Setup

This guide configures Supabase as the **complete backend** for this app — authentication, database, and Row Level Security.

---

## 1. Create a Supabase Project

1. Go to `https://supabase.com/` and create a new project.
2. Wait until the database and API are fully provisioned.

## 2. Get Project Keys

In Supabase Dashboard:

1. Open your project → **Project Settings → API**.
2. Copy:
   - `Project URL`
   - `anon public` key

## 3. Add Environment Variables

In the project root, create `.env` (or copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

- Variable names **must** start with `VITE_` for Vite.
- Do **not** wrap values in quotes.
- **Restart dev server** after editing `.env`.

## 4. Enable Email/Password Auth

In Dashboard → **Authentication → Providers**:
1. Enable **Email** provider.
2. Ensure **Email + Password** sign-in is active.

## 5. Configure URL Settings

In Dashboard → **Authentication → URL Configuration**:
- `Site URL`: `http://localhost:5173`
- Add `http://localhost:5173` to **Redirect URLs**.

Add your production domain too when deploying.

---

## 6. Create Database Tables

Go to **SQL Editor** in the Supabase Dashboard and run this SQL:

```sql
-- =============================================
-- NEURAL AI TOOLS — DATABASE SCHEMA
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- 1) User profiles (extends auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT '',
  bio         TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2) Saved / bookmarked tools
CREATE TABLE saved_tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- 3) Search / recommendation history
CREATE TABLE search_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query       TEXT NOT NULL,
  category    TEXT DEFAULT 'All',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4) Tool reviews / ratings
CREATE TABLE tool_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id     TEXT NOT NULL,
  rating      SMALLINT CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tool_id)
);
```

## 7. Enable Row Level Security (RLS)

Run this SQL after creating the tables:

```sql
-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- ─── Profiles ──────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── Saved Tools ──────────────────────────
ALTER TABLE saved_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved tools"
  ON saved_tools FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save tools"
  ON saved_tools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave tools"
  ON saved_tools FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Search History ───────────────────────
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log searches"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── Tool Reviews ─────────────────────────
ALTER TABLE tool_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON tool_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can write own reviews"
  ON tool_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON tool_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON tool_reviews FOR DELETE
  USING (auth.uid() = user_id);
```

## 8. Run the App

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## How This Project Uses Supabase

| Feature | File | Description |
|---------|------|-------------|
| Client + DB helpers | `src/lib/supabaseClient.js` | Supabase client, CRUD functions for profiles, saved tools, search history, reviews |
| Auth UI | `src/components/AuthPanel.jsx` | Login / signup / logout, auto-creates profile on first login |
| Session management | `src/App.jsx` | Listens to auth state changes, passes session to all routes |
| Save tools | `src/pages/ToolsPage.jsx` | Bookmark icon on each tool card, synced with `saved_tools` table |
| Dashboard | `src/pages/DashboardPage.jsx` | Shows saved tools, recent searches, recommendations |
| Tool cards | `src/components/ToolCard.jsx` | Save/unsave button per tool |

### Behavior
- **No env vars** → App runs in guest mode with a config warning.
- **With env vars** → Full auth + database features are active.
- **Logged out** → Tools page is read-only (no save buttons).
- **Logged in** → Save tools, see dashboard with history and bookmarks.

---

## Database Tables Summary

| Table | Purpose |
|-------|---------|
| `profiles` | User display name, bio, avatar (extends `auth.users`) |
| `saved_tools` | Bookmarked tools per user |
| `search_history` | Logged recommendation queries |
| `tool_reviews` | User ratings (1-5) and comments on tools |

---

## Common Troubleshooting

### "permission denied for table profiles"
→ RLS not enabled or policies not created. Run the RLS SQL from Step 7.

### Saved tools not appearing
→ Check that `saved_tools` table exists and RLS policies are in place.

### Invalid login credentials
→ Verify the account exists in **Authentication → Users**.

### Email sign-up works but login fails
→ Check if email confirmation is required in your auth settings.
- Confirm the email before login.

### "Supabase is not configured" message
- Check `.env` keys and names.
- Restart the dev server.

### Redirect/auth callback issues
- Ensure localhost URL is present in `Authentication -> URL Configuration`.

## 9. Security notes

- Never expose `service_role` key in frontend code.
- Use only `anon` public key in client apps.
- Add `.env` to `.gitignore` (already standard in Vite projects).
