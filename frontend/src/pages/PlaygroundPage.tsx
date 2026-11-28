import { useEffect, useState } from 'react';
import { ArrowLeftRight, Eye, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DialectSelector } from '../components/editor/DialectSelector';
import { SqlEditor } from '../components/editor/SqlEditor';
import { DetectedConcepts } from '../components/explanation/DetectedConcepts';
import { QueryExplanationPanel } from '../components/explanation/QueryExplanationPanel';
import { DiagnosticsBanner } from '../components/feedback/DiagnosticsBanner';
import { ResultTable } from '../components/results/ResultTable';
import { SchemaReferencePanel } from '../features/datasets/SchemaReferencePanel';
import { CompareDialectsPanel } from '../features/dialects/CompareDialectsPanel';
import { useQueryAnalysis } from '../hooks/useQueryAnalysis';
import {
  evaluateQuery,
  getDatasetSchema,
  getDatasets,
  resetDatabase,
} from '../services/explorerApi';
import { DEFAULT_DATASET_ID } from '../services/mockData';
import type {
  DatasetSchema,
  DatasetSummary,
  EvaluateQueryResponse,
  PlaygroundLaunchState,
  SqlDialect,
} from '../types/api';

const STARTER_PRESETS: Array<{ label: string; dialect: SqlDialect; query: string }> = [
  {
    label: 'All students',
    dialect: 'mysql',
    query: 'SELECT *\nFROM Student;',
  },
  {
    label: 'Filter CGPA > 3.42',
    dialect: 'mysql',
    query: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
  },
  {
    label: 'Top 3 (T-SQL)',
    dialect: 'tsql',
    query: 'SELECT TOP 3 Name, CGPA\nFROM Student\nORDER BY CGPA DESC;',
  },
  {
    label: 'Update CGPA demo',
    dialect: 'mysql',
    query: 'UPDATE Student\nSET CGPA = 3.95\nWHERE StudentID = 101;',
  },
  {
    label: 'Insert student demo',
    dialect: 'mysql',
    query:
      "INSERT INTO Student (StudentID, Name, Email, CGPA, DepartmentID)\nVALUES (106, 'Ratul', 'ratul@demo.edu', 3.92, 10);",
  },
  {
    label: 'Unknown column test',
    dialect: 'mysql',
    query: 'SELECT * FROM Student WHERE CGPAA > 3.42;',
  },
];

export function PlaygroundPage() {
  const location = useLocation();
  const launch = (location.state as PlaygroundLaunchState | null) ?? {};

  const initialQuery =
    launch.query ?? 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;';
  const initialDialect: SqlDialect = launch.dialect ?? 'mysql';
  const initialDatasetId = launch.datasetId ?? DEFAULT_DATASET_ID;

  const [query, setQuery] = useState<string>(initialQuery);
  const [dialect, setDialect] = useState<SqlDialect>(initialDialect);
  const [datasetId, setDatasetId] = useState<string>(initialDatasetId);

  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [schema, setSchema] = useState<DatasetSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState<boolean>(true);

  const [result, setResult] = useState<EvaluateQueryResponse | null>(null);
  const [resultSnapshot, setResultSnapshot] = useState<{
    query: string;
    dialect: SqlDialect;
    datasetId: string;
  } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showCompareDialects, setShowCompareDialects] = useState<boolean>(false);

  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetNotice, setResetNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync if user navigates here from a new lesson "Try it" click
  useEffect(() => {
    if (launch.query !== undefined) setQuery(launch.query);
    if (launch.dialect !== undefined) setDialect(launch.dialect);
    if (launch.datasetId !== undefined) setDatasetId(launch.datasetId);
    setResult(null);
    setResultSnapshot(null);
    setEvalError(null);
  }, [launch.query, launch.dialect, launch.datasetId]);

  // Load dataset list once
  useEffect(() => {
    let active = true;
    getDatasets()
      .then((list) => {
        if (active) setDatasets(list);
      })
      .catch(() => {
        // Non-blocking: fallback to default dataset ID
      });
    return () => {
      active = false;
    };
  }, []);

  // Load schema when dataset changes
  useEffect(() => {
    let active = true;
    setSchemaLoading(true);
    getDatasetSchema(datasetId)
      .then((data) => {
        if (active) setSchema(data);
      })
      .catch(() => {
        if (active) setSchema(null);
      })
      .finally(() => {
        if (active) setSchemaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [datasetId]);

  const { analysis, isAnalyzing, networkError } = useQueryAnalysis({
    query,
    dialect,
    datasetId,
    debounceMs: 300,
  });

  const canEvaluate =
    Boolean(query.trim()) &&
    !isAnalyzing &&
    !isEvaluating &&
    analysis?.status === 'valid';

  const isResultStale =
    result !== null &&
    resultSnapshot !== null &&
    (resultSnapshot.query !== query ||
      resultSnapshot.dialect !== dialect ||
      resultSnapshot.datasetId !== datasetId);

  async function refreshSchema() {
    try {
      const updated = await getDatasetSchema(datasetId);
      setSchema(updated);
    } catch {
      // Keep existing schema if refresh fails transiently
    }
  }

  async function handleRevealResult() {
    if (!canEvaluate) return;
    setIsEvaluating(true);
    setEvalError(null);
    setResetNotice(null);

    const requestPayload = { query, dialect, datasetId };
    try {
      const response = await evaluateQuery(requestPayload);
      setResult(response);
      setResultSnapshot(requestPayload);

      // Automatically refresh Dataset Schema Reference after DDL statements
      if (/^\s*(CREATE|ALTER|DROP)\b/i.test(query)) {
        await refreshSchema();
      }
    } catch (err) {
      setEvalError(
        err instanceof Error ? err.message : 'Unable to evaluate this query.'
      );
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleResetDatabase() {
    if (isResetting) return;
    setIsResetting(true);
    setResetNotice(null);
    setEvalError(null);

    try {
      const res = await resetDatabase();
      await refreshSchema();
      setResult(null);
      setResultSnapshot(null);
      setResetNotice({
        type: 'success',
        text: res.message || 'Database restored to initial university-demo-v1 state.',
      });
    } catch (err) {
      setResetNotice({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Unable to reset database right now.',
      });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-5 py-2">
      {/* Context & Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Universal SQL Playground
            </h1>
            {launch.lessonTitle && launch.lessonSlug && (
              <Link
                to={`/learn/${launch.lessonSlug}`}
                className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Lesson: {launch.lessonTitle}
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Write a query, inspect the live explanation, and reveal results when ready.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dataset picker or active badge */}
          {datasets.length > 1 ? (
            <div className="inline-flex items-center gap-2">
              <label
                htmlFor="dataset-select"
                className="text-xs font-medium text-slate-600"
              >
                Dataset
              </label>
              <select
                id="dataset-select"
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
              Dataset: <span className="font-mono font-semibold text-slate-800">{datasetId}</span>
            </div>
          )}

          <DialectSelector
            value={dialect}
            onChange={setDialect}
            id="playground-dialect-select"
            compact
          />

          <button
            type="button"
            onClick={() => setShowCompareDialects((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Compare Dialects
          </button>

          <button
            type="button"
            onClick={handleResetDatabase}
            disabled={isResetting}
            title="Restore all 6 tables and sample rows back to their initial state"
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {isResetting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            {isResetting ? 'Resetting...' : 'Reset Database'}
          </button>
        </div>
      </div>

      {/* Database Reset Confirmation Banner */}
      {resetNotice && (
        <div
          className={`flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs font-medium ${
            resetNotice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{resetNotice.text}</span>
          <button
            type="button"
            onClick={() => setResetNotice(null)}
            className="ml-4 text-xs underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Optional User-Triggered Compare Dialects Drawer */}
      {showCompareDialects && (
        <CompareDialectsPanel
          currentDialect={dialect}
          onClose={() => setShowCompareDialects(false)}
        />
      )}

      {/* Starter Example Loader */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Quick examples:</span>
        {STARTER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setDialect(preset.dialect);
              setQuery(preset.query);
            }}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Split Workspace: Editor + Results on Left, Analysis on Right */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <SqlEditor
            value={query}
            onChange={setQuery}
            dialect={dialect}
            hasResetTarget={Boolean(launch.query)}
            onReset={
              launch.query
                ? () => {
                    setQuery(launch.query!);
                    if (launch.dialect) setDialect(launch.dialect);
                  }
                : undefined
            }
            onClear={() => setQuery('')}
          />

          {/* Explicit Result Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
            <div className="text-xs text-slate-600">
              {!query.trim() ? (
                'Enter a SQL query above to begin.'
              ) : isAnalyzing ? (
                'Checking query syntax and semantics...'
              ) : analysis?.status === 'valid' ? (
                <span className="font-medium text-emerald-700">
                  Query is valid and ready to evaluate.
                </span>
              ) : (
                'Resolve the feedback on the right before viewing results.'
              )}
            </div>

            <button
              type="button"
              onClick={handleRevealResult}
              disabled={!canEvaluate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Query...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Want to see the result?
                </>
              )}
            </button>
          </div>

          <ResultTable
            result={result}
            isStale={isResultStale}
            evalError={evalError}
          />
        </div>

        {/* Right Column: Live Interpretation & Diagnostics */}
        <div className="space-y-4 lg:col-span-5">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Live Query Interpretation
              </h2>
            </div>

            {!query.trim() ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">
                Type a query or pick one of the quick examples above to see automatic
                concept detection and a clause-by-clause explanation.
              </div>
            ) : (
              <>
                <DetectedConcepts
                  concepts={analysis?.concepts ?? []}
                  isAnalyzing={isAnalyzing}
                />

                <DiagnosticsBanner
                  status={analysis?.status}
                  explanation={analysis?.explanation}
                  diagnostics={analysis?.diagnostics}
                  networkError={networkError}
                />

                {analysis?.status === 'valid' && (
                  <QueryExplanationPanel
                    explanation={analysis.explanation}
                    breakdown={analysis.breakdown}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Collapsible Dataset Schema Reference */}
      <SchemaReferencePanel schema={schema} loading={schemaLoading} />
    </div>
  );
}
