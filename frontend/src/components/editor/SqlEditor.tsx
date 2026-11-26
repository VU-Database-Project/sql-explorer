import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { MySQL, MSSQL, sql } from '@codemirror/lang-sql';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { SqlDialect } from '../../types/api';

interface SqlEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  dialect: SqlDialect;
  onReset?: () => void;
  onClear: () => void;
  hasResetTarget: boolean;
}

export function SqlEditor({
  value,
  onChange,
  dialect,
  onReset,
  onClear,
  hasResetTarget,
}: SqlEditorProps) {
  const extensions = useMemo(() => {
    const sqlDialect = dialect === 'tsql' ? MSSQL : MySQL;
    return [sql({ dialect: sqlDialect })];
  }, [dialect]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            SQL Editor
          </span>
          <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700">
            {dialect === 'mysql' ? 'MySQL' : 'T-SQL'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasResetTarget && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Starter
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            disabled={!value}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div aria-label="SQL query editor">
        <CodeMirror
          value={value}
          height="170px"
          extensions={extensions}
          onChange={onChange}
          placeholder="Write a SELECT query here, e.g. SELECT Name, CGPA FROM Student WHERE CGPA > 3.42;"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: false,
            autocompletion: true,
          }}
          className="text-sm"
        />
      </div>
    </div>
  );
}