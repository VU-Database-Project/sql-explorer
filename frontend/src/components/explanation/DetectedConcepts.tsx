import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { QueryConcept } from '../../types/api';

interface DetectedConceptsProps {
  concepts: QueryConcept[];
  isAnalyzing: boolean;
}

export function DetectedConcepts({ concepts, isAnalyzing }: DetectedConceptsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Tag className="h-3.5 w-3.5" />
          Detected SQL Concepts
        </span>
        {isAnalyzing && (
          <span className="text-xs text-blue-600">Analyzing...</span>
        )}
      </div>

      {concepts.length === 0 ? (
        <p className="text-xs text-slate-500">
          Concepts are detected automatically from your SQL structure—no manual tags needed.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {concepts.map((concept) =>
            concept.topicSlug ? (
              <Link
                key={concept.id}
                to={`/learn/${concept.topicSlug}`}
                title={`Open briefing for ${concept.label}`}
                className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
              >
                {concept.label}
              </Link>
            ) : (
              <span
                key={concept.id}
                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                {concept.label}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}