import { useState } from 'react';
import { ChevronDown, ChevronRight, KeyRound, Table2 } from 'lucide-react';
import type { DatasetSchema } from '../../types/api';

interface SchemaReferencePanelProps {
  schema: DatasetSchema | null;
  loading: boolean;
}

export function SchemaReferencePanel({ schema, loading }: SchemaReferencePanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 rounded-xl"
      >
        <span className="inline-flex items-center gap-2">
          <Table2 className="h-4 w-4 text-blue-600" />
          Dataset Schema Reference
          {schema && (
            <span className="font-mono text-xs font-normal text-slate-500">
              ({schema.tables.length} tables)
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          {loading && (
            <p className="text-xs text-slate-500">Loading dataset schema...</p>
          )}

          {!loading && !schema && (
            <p className="text-xs text-slate-500">Schema metadata unavailable.</p>
          )}

          {!loading && schema && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {schema.tables.map((table) => (
                <div
                  key={table.name}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {table.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {table.columns.length} cols
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {table.columns.map((col) => (
                      <li
                        key={col.name}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="inline-flex items-center gap-1 font-mono text-slate-800">
                          {col.isPrimaryKey && (
                            <KeyRound
                              className="h-3 w-3 text-amber-600"
                              aria-label="Primary key"
                            />
                          )}
                          {col.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {col.dataType}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}