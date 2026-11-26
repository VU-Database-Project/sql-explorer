import { AlertTriangle, Table } from 'lucide-react';
import type { EvaluateQueryResponse } from '../../types/api';

interface ResultTableProps {
  result: EvaluateQueryResponse | null;
  isStale: boolean;
  evalError: string | null;
}

export function ResultTable({ result, isStale, evalError }: ResultTableProps) {
  if (evalError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
      >
        <p className="font-semibold">Evaluation Error</p>
        <p className="mt-1 text-red-800">{evalError}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <Table className="mx-auto h-6 w-6 text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-700">No result table revealed yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Read the explanation above first, then click{' '}
          <strong className="font-semibold text-slate-700">“Want to see the result?”</strong>{' '}
          when your query is valid.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {isStale && (
        <div
          role="status"
          className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Results below are from an earlier query or setting. Click{' '}
            <strong>“Want to see the result?”</strong> again to refresh.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
        <span className="font-semibold text-slate-700">
          Query Result ({result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'})
        </span>
        <span className="font-mono text-slate-500">
          {result.datasetId} • {result.dialect}
        </span>
      </div>

      {result.rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-600">
          Valid query — <strong>0 matching rows</strong> in <code className="font-mono">{result.datasetId}</code>.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {result.columns.map((col) => (
                  <th
                    key={col.name}
                    scope="col"
                    className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold text-slate-700"
                  >
                    {col.name}
                    <span className="ml-1.5 font-normal text-slate-400">({col.type})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {result.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/80">
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-800"
                    >
                      {cell === null ? (
                        <span className="italic text-slate-400">NULL</span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}