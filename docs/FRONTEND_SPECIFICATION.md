# Frontend Specification

## Architecture
- `src/pages/`: `HomePage`, `LearnPage`, `TopicPage`, `PlaygroundPage` (universal playground shared across all lessons).
- `src/components/`: `editor` (CodeMirror + DialectSelector), `explanation` (DetectedConcepts + QueryExplanationPanel), `feedback` (DiagnosticsBanner), `results` (ResultTable), `layout` (AppLayout).
- `src/features/`: `datasets` (SchemaReferencePanel), `dialects` (CompareDialectsPanel).
- `src/hooks/useQueryAnalysis.ts`: 300ms debounced analysis with AbortController and request sequence-ID race protection.
- `src/services/`: `apiClient.ts`, `explorerApi.ts`, `mockApi.ts`, `mockData.ts`.
- `src/types/api.ts`: Shared TypeScript API contract.

## Expected Backend Endpoints
- `GET /api/topics` -> `TopicSummary[]`
- `GET /api/topics/:slug` -> `TopicDetail`
- `GET /api/datasets` -> `DatasetSummary[]`
- `GET /api/datasets/:id/schema` -> `DatasetSchema`
- `POST /api/query/analyze` -> Request `{ query, dialect, datasetId }`, Response `{ status, datasetId, dialect, concepts, explanation, breakdown, diagnostics }`
- `POST /api/query/evaluate` -> Request `{ query, dialect, datasetId }`, Response `{ status: "success", datasetId, dialect, columns, rows, rowCount }`
