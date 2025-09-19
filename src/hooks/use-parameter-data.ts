'use client';

import { useEffect, useRef, useState } from 'react';

import { getLatestParameterData } from '@/actions/data';
import type { Parameter } from '@/lib/types';

const FALLBACK_FETCH_INTERVAL_MS = 5000;
const STREAM_RETRY_DELAY_MS = 4000;

function hasInitialData(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
}

export function useParameterData<T = unknown>(
  dashboardName: string,
  parameter: Parameter,
  initialData: T | null = null,
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(!hasInitialData(initialData));
  const [error, setError] = useState<string | null>(null);
  const lastUpdateVersionRef = useRef(0);

  const parameterId = parameter.id;
  const displayType = parameter.displayType;
  const valueKey = parameter.name?.trim() ? parameter.name.trim() : parameter.id;

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let awaitingFirstFetch = true;
    let isFetching = false;

    const fetchLatest = async () => {
      if (isFetching) {
        return;
      }

      const fetchVersion = lastUpdateVersionRef.current;
      isFetching = true;

      try {
        if (awaitingFirstFetch) {
          setIsLoading(true);
        }
        setError(null);
        const result = await getLatestParameterData(dashboardName, {
          id: parameterId,
          displayType,
          valueKey,
        });
        if (cancelled) {
          return;
        }
        if (result !== undefined) {
          const hasStreamUpdate = lastUpdateVersionRef.current !== fetchVersion;
          if (awaitingFirstFetch || !hasStreamUpdate) {
            setData((result ?? null) as T | null);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
        console.error(`Failed to fetch data for parameter ${parameterId}:`, err);
      } finally {
        awaitingFirstFetch = false;
        isFetching = false;
      }
    };

    const ensureFallback = () => {
      if (!fallbackTimer) {
        fallbackTimer = setInterval(() => {
          void fetchLatest();
        }, FALLBACK_FETCH_INTERVAL_MS);
      }
    };

    const connectStream = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const url = new URL(
        `/api/dashboards/${encodeURIComponent(dashboardName)}/parameters/${encodeURIComponent(parameterId)}/stream`,
        window.location.origin,
      );
      url.searchParams.set('displayType', displayType);
      if (valueKey) {
        url.searchParams.set('valueKey', valueKey);
      }

      const source = new EventSource(url.toString());
      eventSource = source;

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const nextData = payload?.data ?? payload;
          if (!cancelled) {
            setData((nextData ?? null) as T | null);
            setIsLoading(false);
            setError(null);
            lastUpdateVersionRef.current += 1;
            awaitingFirstFetch = false;
          }
        } catch (parseError) {
          console.error('Failed to parse parameter stream payload:', parseError);
        }
      };

      source.onerror = () => {
        if (cancelled) {
          return;
        }
        source.close();
        ensureFallback();
        reconnectTimer = setTimeout(() => {
          connectStream();
        }, STREAM_RETRY_DELAY_MS);
      };
    };

    void fetchLatest();
    ensureFallback();
    connectStream();

    return () => {
      cancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [dashboardName, parameterId, displayType, valueKey]);

  return { data, isLoading, error };
}
