import { AlertCircle, AlertTriangle, Info, WifiOff } from 'lucide-react';
import type { QueryDiagnostic, QueryStatus } from '../../types/api';

interface DiagnosticsBannerProps {
  status?: QueryStatus;
  explanation?: string;
  diagnostics?: QueryDiagnostic[];
  networkError?: string | null;
}

export function DiagnosticsBanner({
  status,
  explanation,
  diagnostics = [],
  networkError,
}: DiagnosticsBannerProps) {
  if (networkError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
      >
        <div className="flex items-start gap-2.5">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="mt-0.5 text-red-800">{networkError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status || status === 'valid') return null;

  const config: Record<
    Exclude<QueryStatus, 'valid'>,
    { title: string; container: string; iconColor: string; Icon: typeof Info }
  > = {
    incomplete: {
      title: 'Incomplete Query',
      container: 'border-sky-200 bg-sky-50 text-sky-950',
      iconColor: 'text-sky-600',
      Icon: Info,
    },
    unsupported: {
      title: 'Not Supported Yet',
      container: 'border-amber-200 bg-amber-50 text-amber-950',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
    },
    syntax_error: {
      title: 'Syntax Error',
      container: 'border-red-200 bg-red-50 text-red-950',
      iconColor: 'text-red-600',
      Icon: AlertCircle,
    },
    semantic_error: {
      title: 'Semantic Error (Unknown Table or Column)',
      container: 'border-red-200 bg-red-50 text-red-950',
      iconColor: 'text-red-600',
      Icon: AlertCircle,
    },
  };

  const { title, container, iconColor, Icon } = config[status];

  return (
    <div role="status" className={`rounded-lg border p-4 text-sm ${container}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
        <div className="space-y-1.5">
          <p className="font-semibold">{title}</p>
          {explanation && <p>{explanation}</p>}
          {diagnostics.length > 0 && (
            <ul className="space-y-1 pt-1 text-xs">
              {diagnostics.map((diag, idx) => (
                <li key={`${diag.code}-${idx}`} className="font-medium">
                  {diag.message}
                  {typeof diag.line === 'number' && typeof diag.column === 'number' && (
                    <span className="ml-1.5 opacity-75">
                      (line {diag.line}, col {diag.column})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}