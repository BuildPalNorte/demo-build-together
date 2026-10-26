'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { soundEffects } from '@/lib/audio/sound-effects';

export interface ParticipantData {
  id: string;
  displayName: string;
  discipline: string;
  skills: string[];
  interests: string[];
  goal: string;
  createdAt: string;
}

export interface ConnectionData {
  id: string;
  sourceId: string;
  targetId: string;
  score: number;
  reason: string;
  createdAt: string;
}

export interface NetworkStats {
  totalBuilders: number;
  totalConnections: number;
  disciplinesCount: number;
  breakdown: Record<string, number>;
}

export type RealtimeStatus = 'live' | 'polling' | 'reconnecting' | 'error';

export interface UseNetworkRealtimeOptions {
  eventSlug: string;
  pollIntervalMs?: number;
  enableSound?: boolean;
  onNewParticipant?: (participant: ParticipantData) => void;
  onNewConnection?: (connection: ConnectionData) => void;
}

export function useNetworkRealtime({
  eventSlug,
  pollIntervalMs = 1200,
  enableSound = true,
  onNewParticipant,
  onNewConnection,
}: UseNetworkRealtimeOptions) {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    totalBuilders: 0,
    totalConnections: 0,
    disciplinesCount: 0,
    breakdown: {},
  });
  const [status, setStatus] = useState<RealtimeStatus>('polling');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isInitialSnapshotRef = useRef<boolean>(true);
  const seenParticipantIdsRef = useRef<Set<string>>(new Set());
  const seenConnectionIdsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchData = useCallback(
    async (isManualTrigger = false) => {
      if (isFetchingRef.current && !isManualTrigger) return;
      isFetchingRef.current = true;

      // Abort previous in-flight request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(`/api/events/${eventSlug}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch event data');
        }

        const fetchedParticipants: ParticipantData[] = json.participants || [];
        const fetchedConnections: ConnectionData[] = json.connections || [];
        const fetchedStats: NetworkStats = json.stats || {
          totalBuilders: 0,
          totalConnections: 0,
          disciplinesCount: 0,
          breakdown: {},
        };

        if (isInitialSnapshotRef.current) {
          // Initial snapshot: record all seen IDs WITHOUT playing audio
          for (const p of fetchedParticipants) {
            seenParticipantIdsRef.current.add(p.id);
          }
          for (const c of fetchedConnections) {
            seenConnectionIdsRef.current.add(c.id);
          }
          isInitialSnapshotRef.current = false;
        } else {
          // Subsequent updates: detect genuinely new participants
          let hasNewParticipant = false;
          for (const p of fetchedParticipants) {
            if (!seenParticipantIdsRef.current.has(p.id)) {
              seenParticipantIdsRef.current.add(p.id);
              hasNewParticipant = true;
              if (enableSound) {
                soundEffects.playNodeCreated();
              }
              onNewParticipant?.(p);
            }
          }

          // Detect genuinely new connections
          for (const c of fetchedConnections) {
            if (!seenConnectionIdsRef.current.has(c.id)) {
              seenConnectionIdsRef.current.add(c.id);
              if (enableSound) {
                soundEffects.playConnectionFormed();
              }
              onNewConnection?.(c);
            }
          }
        }

        setParticipants(fetchedParticipants);
        setConnections(fetchedConnections);
        setStats(fetchedStats);
        setError(null);
        setStatus((prev) => (prev === 'reconnecting' ? 'polling' : prev));
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        console.warn('Realtime sync fetch error:', err);
        setError((err as Error)?.message || 'Error de sincronización');
        setStatus('reconnecting');
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [eventSlug, enableSound, onNewParticipant, onNewConnection]
  );

  // Check if native Neon Realtime is enabled
  useEffect(() => {
    let isCancelled = false;

    async function checkRealtimeSupport() {
      try {
        const res = await fetch(`/api/events/${eventSlug}/realtime`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data.enabled) {
          setStatus('live');
        }
      } catch {
        // Keep polling status
      }
    }

    checkRealtimeSupport();

    return () => {
      isCancelled = true;
    };
  }, [eventSlug]);

  // Main polling loop with tab visibility awareness
  useEffect(() => {
    fetchData();

    function scheduleNextPoll() {
      if (document.hidden) {
        // Slow down polling when document is not visible
        pollTimerRef.current = setTimeout(async () => {
          await fetchData();
          scheduleNextPoll();
        }, 5000);
      } else {
        pollTimerRef.current = setTimeout(async () => {
          await fetchData();
          scheduleNextPoll();
        }, pollIntervalMs);
      }
    }

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab brought to foreground: immediately refresh
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        fetchData(true);
        scheduleNextPoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData, pollIntervalMs]);

  const refreshNow = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    participants,
    connections,
    stats,
    status,
    isLoading,
    error,
    refreshNow,
  };
}
