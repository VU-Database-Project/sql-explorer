import { Info, X } from 'lucide-react';
import type { SqlDialect } from '../../types/api';

interface CompareDialectsPanelProps {
  currentDialect: SqlDialect;
  onClose: () => void;
}

export function CompareDialectsPanel({
  currentDialect,
  onClose,
}: CompareDialectsPanelProps) {
  return (
    <aside
      aria-label="Compare SQL Dialects"
      className="rounded-xl border border-slate-300 bg-white p-5 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Compare Dialects: MySQL vs. Microsoft SQL Server (T-SQL)
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Active editor dialect:{' '}
            <strong>{currentDialect === 'mysql' ? 'MySQL' : 'T-SQL'}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialect comparison"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>
          <strong>Automatic query translation is coming later:</strong> the{' '}
          <code className="font-mono">POST /api/query/compare</code> endpoint is not
          active yet, so your current query is not translated automatically. Below is a
          verified static reference for row-limiting syntax.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-800">MySQL (LIMIT at end)</p>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-2.5 font-mono text-xs text-slate-100">
            {'SELECT Name, CGPA\nFROM Student\nORDER BY CGPA DESC\nLIMIT 3;'}
          </pre>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-800">
            T-SQL / SQL Server (TOP after SELECT)
          </p>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-2.5 font-mono text-xs text-slate-100">
            {'SELECT TOP 3 Name, CGPA\nFROM Student\nORDER BY CGPA DESC;'}
          </pre>
        </div>
      </div>
    </aside>
  );
}