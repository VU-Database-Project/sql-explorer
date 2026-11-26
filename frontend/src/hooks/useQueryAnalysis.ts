import { useEffect, useRef, useState } from 'react';
import { analyzeQuery } from '../services/explorerApi';
import type { AnalyzeQueryResponse, SqlDialect } from '../types/api';

interface UseQueryAnalysisParams {
  query: string;
  dialect: SqlDialect;
  datasetId: string;
  debounceMs?: number;
}

export interface UseQueryAnalysisResult {
  analysis: AnalyzeQueryResponse | null;
  isAnalyzing: boolean;
  networkError: string | null;
}

export function useQueryAnalysis({
  query,
  dialect,
  datasetId,
  debounceMs = 300,
}: UseQueryAnalysisParams): UseQueryAnalysisResult {
  const [analysis, setAnalysis] = useState<AnalyzeQueryResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const seq = ++requestSeqRef.current;

    if (!trimmed) {
      setAnalysis(null);
      setIsAnalyzing(false);
      setNetworkError(null);
      return;
    }

    const controller = new AbortController();
    setIsAnalyzing(true);
    setNetworkError(null);

    const timer = window.setTimeout(async () => {
      try {
        const result = await analyzeQuery(
          { query, dialect, datasetId },
          controller.signal
        );
        if (requestSeqRef.current === seq) {
          setAnalysis(result);
          setIsAnalyzing(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (requestSeqRef.current === seq) {
          setAnalysis(null);
          setNetworkError(
            err instanceof Error
              ? err.message
              : 'Failed to analyze query. Please try again.'
          );
          setIsAnalyzing(false);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, dialect, datasetId, debounceMs]);

  return { analysis, isAnalyzing, networkError };
}