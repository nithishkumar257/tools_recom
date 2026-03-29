import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ── User Profiles ─────────────────────────────────

/** Get or create profile for the logged-in user */
export async function getProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code === 'PGRST116') {
    // Row not found – create one
    const { data: created } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select()
      .single();
    return created;
  }
  return data;
}

export async function updateProfile(userId, updates) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Saved / Favourite Tools ───────────────────────

export async function getSavedTools(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_tools')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveTool(userId, toolId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('saved_tools')
    .insert({ user_id: userId, tool_id: toolId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function unsaveTool(userId, toolId) {
  if (!supabase) return;
  const { error } = await supabase
    .from('saved_tools')
    .delete()
    .eq('user_id', userId)
    .eq('tool_id', toolId);
  if (error) throw error;
}

// ── Search / Recommendation History ───────────────

export async function getSearchHistory(userId, limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function logSearch(userId, query, category) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('search_history')
    .insert({ user_id: userId, query, category })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Tool Reviews / Ratings ────────────────────────

export async function getToolReviews(toolId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tool_reviews')
    .select('*, profiles(display_name)')
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertReview(userId, toolId, rating, comment) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('tool_reviews')
    .upsert(
      { user_id: userId, tool_id: toolId, rating, comment },
      { onConflict: 'user_id,tool_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Agent Telemetry Events ───────────────────────

async function getCurrentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export async function logAgentToolEvents(events = []) {
  if (!supabase || !Array.isArray(events) || events.length === 0) return [];

  const userId = await getCurrentUserId();
  const payload = events
    .filter((event) => event?.tool_id && event?.event_type)
    .map((event) => ({
      user_id: userId,
      tool_id: String(event.tool_id),
      event_type: String(event.event_type),
      metadata: event.metadata || {},
      created_at: event.created_at || new Date().toISOString(),
    }));

  if (payload.length === 0) return [];

  const { data, error } = await supabase
    .from('agent_tool_events')
    .insert(payload)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchRecentAgentToolEvents(days = 30, limit = 5000) {
  if (!supabase) return [];

  const since = new Date(Date.now() - Number(days || 30) * 24 * 60 * 60 * 1000).toISOString();
  const normalizedLimit = Math.max(100, Math.min(10000, Number(limit || 5000)));

  const { data, error } = await supabase
    .from('agent_tool_events')
    .select('tool_id, event_type, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(normalizedLimit);

  if (error) {
    throw error;
  }

  return data || [];
}
