import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import type { QueryBreakdownItem } from '../../types/api';

interface QueryExplanationPanelProps {
  explanation: string;
  breakdown: QueryBreakdownItem[];
}

export function QueryExplanationPanel({
  explanation,
  breakdown,
}: QueryExplanationPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Plain-Language Explanation
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed font-medium text-slate-900">
          {explanation}
        </p>
      </div>

      {breakdown.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Clause & Component Breakdown
          </h3>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {breakdown.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600/30"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs text-slate-100">
                          {item.sourceText}
                        </code>
                        <span className="text-xs font-semibold text-slate-700">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{item.explanation}</p>
                    </div>

                    {item.variationHint && (
                      <span className="mt-0.5 shrink-0 text-slate-400">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </button>

                  {isOpen && item.variationHint && (
                    <div className="flex items-start gap-2 border-t border-slate-100 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-900">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <span>
                        <strong>Experiment idea:</strong> {item.variationHint}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}