import { useEffect, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DialectSelector } from '../components/editor/DialectSelector';
import { getTopicBySlug } from '../services/explorerApi';
import type {
  PlaygroundLaunchState,
  SqlDialect,
  TopicDetail,
} from '../types/api';

export function TopicPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [dialect, setDialect] = useState<SqlDialect>('mysql');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTopicBySlug(slug)
      .then((data) => {
        if (!active) return;
        setTopic(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Topic not found.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  function handleTryInPlayground() {
    if (!topic) return;
    const launchState: PlaygroundLaunchState = {
      query: topic.example.queryByDialect[dialect],
      dialect,
      datasetId: topic.example.datasetId,
      lessonSlug: topic.slug,
      lessonTitle: topic.title,
      focusConcept: topic.title,
    };
    navigate('/playground', { state: launchState });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading topic briefing...
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="space-y-4">
        <Link
          to="/learn"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learn
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          {error || 'Topic not found.'}
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl space-y-6 py-2">
      {/* Top breadcrumb + dialect toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/learn"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All Topics
        </Link>

        <DialectSelector value={dialect} onChange={setDialect} id="topic-dialect-select" />
      </div>

      {/* Header card */}
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-blue-700">
            {topic.category}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-slate-700">
            {topic.difficulty}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {topic.title}
        </h1>
        <p className="mt-2 text-base text-slate-600">{topic.summary}</p>

        <div className="mt-5">
          <button
            type="button"
            onClick={handleTryInPlayground}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
          >
            <Play className="h-4 w-4" />
            Try it in Playground
          </button>
        </div>
      </header>

      {/* What it means & Why it exists */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            What it means
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{topic.overview}</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Why it is useful
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {topic.whyItExists}
          </p>
        </section>
      </div>

      {/* Syntax & Component Breakdown */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Syntax Pattern ({dialect === 'mysql' ? 'MySQL' : 'T-SQL'})
          </h2>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
            {topic.syntaxByDialect[dialect]}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Query Components</h3>
          <dl className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {topic.components.map((comp) => (
              <div
                key={comp.token}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="shrink-0 font-mono text-xs font-semibold text-blue-700 sm:w-44">
                  {comp.token}
                </dt>
                <dd className="text-sm text-slate-700">{comp.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Worked Example */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Worked Example: {topic.example.title}
            </h2>
            <p className="text-xs text-slate-500">
              Dataset: <span className="font-mono">{topic.example.datasetId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleTryInPlayground}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          >
            <Play className="h-3.5 w-3.5" />
            Load into Playground
          </button>
        </div>

        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
          {topic.example.queryByDialect[dialect]}
        </pre>

        <p className="text-sm text-slate-700">{topic.example.explanation}</p>
      </section>

      {/* Safe Variations & Related Concepts */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900">Variations to try</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {topic.variations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900">Related concepts</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topic.relatedSlugs.map((relSlug) => (
              <Link
                key={relSlug}
                to={`/learn/${relSlug}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:border-blue-400 hover:text-blue-700"
              >
                {relSlug}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}