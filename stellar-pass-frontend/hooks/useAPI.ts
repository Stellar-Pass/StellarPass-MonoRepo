"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseAPIOptions {
  immediate?: boolean;
  token?: string;
}

interface UseAPIReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAPI<T>(
  fetcher: () => Promise<{ data?: T; error?: string }>,
  options: UseAPIOptions = {}
): UseAPIReturn<T> {
  const { immediate = true, token } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (mountedRef.current) {
        if (response.error) {
          setError(response.error);
          setData(null);
        } else {
          setData(response.data ?? null);
          setError(null);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setData(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      fetchData();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, fetchData, token]);

  return { data, loading, error, refetch: fetchData };
}

interface UseMutationReturn<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<T, V = unknown>(
  mutator: (variables: V) => Promise<{ data?: T; error?: string }>
): UseMutationReturn<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await mutator(variables);
        if (response.error) {
          setError(response.error);
          setData(null);
          return null;
        }
        setData(response.data ?? null);
        setError(null);
        return response.data ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        setData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutator]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, loading, error, reset };
}
