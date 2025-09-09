'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLatestParameterData } from '@/actions/data';
import { Parameter } from '@/lib/types';

const FETCH_INTERVAL_MS = 2500;

export function useParameterData(parameter: Parameter, initialData: any | null = null) {
  const [data, setData] = useState<any>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Don't set loading to true on subsequent fetches to avoid UI flicker
      if (!data) {
        setIsLoading(true);
      }
      setError(null);
      const result = await getLatestParameterData(parameter);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(`Failed to fetch data for parameter ${parameter.id}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [parameter, data]); // Add `data` to dependencies to avoid flicker on first load

  useEffect(() => {
    // Fetch data immediately on component mount
    fetchData();

    // Then fetch data at the specified interval
    const interval = setInterval(fetchData, FETCH_INTERVAL_MS);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error };
}
