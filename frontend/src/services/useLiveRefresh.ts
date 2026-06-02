import { useEffect, useEffectEvent, useRef } from 'react';
import { API_URL } from '../../services/api';

type LiveRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
};

export const useLiveRefresh = (
  refresh: () => Promise<void> | void,
  options?: LiveRefreshOptions
) => {
  const { enabled = true, intervalMs = 15000 } = options || {};
  const inFlightRef = useRef(false);

  const runRefresh = useEffectEvent(async () => {
    if (!enabled || document.visibilityState !== 'visible' || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    try {
      await refresh();
    } finally {
      inFlightRef.current = false;
    }
  });

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    const intervalId = window.setInterval(() => {
      void runRefresh();
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void runRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    try {
      eventSource = new EventSource(`${API_URL}/realtime/stream`, { withCredentials: true });
      eventSource.addEventListener('change', () => {
        void runRefresh();
      });
    } catch {
      eventSource = null;
    }

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      eventSource?.close();
    };
  }, [enabled, intervalMs, runRefresh]);
};
