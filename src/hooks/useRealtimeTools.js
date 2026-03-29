import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Real-time hook to subscribe to tool table changes
 * Listens for INSERT, UPDATE, DELETE events
 */
export function useRealtimeTools() {
  const [realtimeUpdate, setRealtimeUpdate] = useState(null);
  const [liveIndicator, setLiveIndicator] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    // Subscribe to all changes on the tools table
    const subscription = supabase
      .channel('tools-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tools' },
        (payload) => {
          // Payload contains: new, old, and eventType (INSERT, UPDATE, DELETE)
          setRealtimeUpdate({
            type: payload.eventType,
            tool: payload.new || payload.old,
            timestamp: new Date(),
          });

          // Show live indicator briefly
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 3000);

          console.log('[Real-time] Tool update:', {
            event: payload.eventType,
            tool: payload.new?.name || payload.old?.name,
          });
        }
      )
      .subscribe();

    return () => {
      // Cleanup subscription
      supabase.removeChannel(subscription);
    };
  }, []);

  return { realtimeUpdate, liveIndicator };
}

/**
 * Hook to listen for new tools specifically
 */
export function useNewTools() {
  const [newTools, setNewTools] = useState([]);

  useEffect(() => {
    if (!supabase) return;

    const subscription = supabase
      .channel('new-tools')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tools' },
        (payload) => {
          setNewTools((prev) => [
            { ...payload.new, addedAt: new Date() },
            ...prev.slice(0, 4), // Keep last 5
          ]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return { newTools };
}
