import { DIALECT_OPTIONS, type SqlDialect } from '../../types/api';

interface DialectSelectorProps {
  value: SqlDialect;
  onChange: (dialect: SqlDialect) => void;
  id?: string;
  compact?: boolean;
}

export function DialectSelector({
  value,
  onChange,
  id = 'sql-dialect-select',
  compact = false,
}: DialectSelectorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <label
        htmlFor={id}
        className={
          compact
            ? 'text-xs font-medium text-slate-600'
            : 'text-sm font-medium text-slate-700'
        }
      >
        Dialect
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SqlDialect)}
        className={`rounded-md border border-slate-300 bg-white font-medium text-slate-800 shadow-xs transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        }`}
      >
        {DIALECT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}