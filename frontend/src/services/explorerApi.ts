import type {
  AnalyzeQueryRequest,
  AnalyzeQueryResponse,
  DatasetSchema,
  DatasetSummary,
  EvaluateQueryRequest,
  EvaluateQueryResponse,
  TopicDetail,
  TopicSummary,
} from '../types/api';
import { USE_MOCK_API, fetchJson } from './apiClient';
import {
  mockAnalyzeQuery,
  mockEvaluateQuery,
  mockGetDatasetSchema,
  mockGetDatasets,
  mockGetTopicBySlug,
  mockGetTopics,
} from './mockApi';

export function getTopics(): Promise<TopicSummary[]> {
  if (USE_MOCK_API) return mockGetTopics();
  return fetchJson<TopicSummary[]>('/api/topics');
}

export function getTopicBySlug(slug: string): Promise<TopicDetail> {
  if (USE_MOCK_API) return mockGetTopicBySlug(slug);
  return fetchJson<TopicDetail>(`/api/topics/${encodeURIComponent(slug)}`);
}

export function getDatasets(): Promise<DatasetSummary[]> {
  if (USE_MOCK_API) return mockGetDatasets();
  return fetchJson<DatasetSummary[]>('/api/datasets');
}

export function getDatasetSchema(datasetId: string): Promise<DatasetSchema> {
  if (USE_MOCK_API) return mockGetDatasetSchema(datasetId);
  return fetchJson<DatasetSchema>(
    `/api/datasets/${encodeURIComponent(datasetId)}/schema`
  );
}

export function analyzeQuery(
  payload: AnalyzeQueryRequest,
  signal?: AbortSignal
): Promise<AnalyzeQueryResponse> {
  if (USE_MOCK_API) return mockAnalyzeQuery(payload, signal);
  return fetchJson<AnalyzeQueryResponse>('/api/query/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

export function evaluateQuery(
  payload: EvaluateQueryRequest,
  signal?: AbortSignal
): Promise<EvaluateQueryResponse> {
  if (USE_MOCK_API) return mockEvaluateQuery(payload, signal);
  return fetchJson<EvaluateQueryResponse>('/api/query/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}