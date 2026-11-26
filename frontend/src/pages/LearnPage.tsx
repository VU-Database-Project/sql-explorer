import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopics } from '../services/explorerApi';
import type { TopicSummary } from '../types/api';

export function LearnPage() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTopics()
      .then((data) => {
        if (!active) return;
        setTopics(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load topics.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, TopicSummary[]>();
    for (const topic of topics) {
      const existing = groups.get(topic.category) ?? [];
      existing.push(topic);
      groups.set(topic.category, existing);
    }
    return Array.from(groups.entries());
  }, [topics]);

  return (
    <div className="space-y-8 py-2">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Learn SQL Concepts
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Each briefing explains a concept in plain language and opens the universal
          playground with a preloaded example.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading SQL topics...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {!loading && !error && groupedTopics.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No topics available yet.
        </div>
      )}

      {!loading &&
        !error &&
        groupedTopics.map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              {category}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((topic) => (
                <Link
                  key={topic.slug}
                  to={`/learn/${topic.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
                        <BookOpen className="h-3.5 w-3.5" />
                        {topic.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {topic.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600">
                      {topic.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-600">
                      {topic.summary}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    {topic.prerequisites.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Prerequisites: {topic.prerequisites.join(', ')}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                      Open briefing
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}