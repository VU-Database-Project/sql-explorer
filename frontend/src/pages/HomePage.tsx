import { ArrowRight, BookOpen, Code2, Eye, Layers, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlaygroundLaunchState } from '../types/api';

const LEARNING_STEPS = [
  {
    step: '01',
    title: 'Write or load a query',
    description:
      'Start from a topic briefing or write directly in the universal SQL playground in MySQL or T-SQL.',
    icon: Code2,
  },
  {
    step: '02',
    title: 'See detected concepts & meaning',
    description:
      'The backend parses your SQL syntax, identifies concepts automatically, and explains each clause in plain English.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Experiment with variations',
    description:
      'Change an operator (> to >=), swap columns, or switch dialects and watch how the explanation updates.',
    icon: Layers,
  },
  {
    step: '04',
    title: 'Reveal the result when ready',
    description:
      'Click "Want to see the result?" to evaluate valid queries safely against synthetic university sample data.',
    icon: Eye,
  },
];

const FEATURED_TOPICS = [
  {
    slug: 'select',
    title: 'SELECT & FROM',
    summary: 'Choose output columns and specify which table to read rows from.',
    sampleQuery: 'SELECT Name, CGPA\nFROM Student;',
  },
  {
    slug: 'where',
    title: 'Filtering with WHERE',
    summary: 'Keep only rows that match comparison rules such as CGPA > 3.42.',
    sampleQuery: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
  },
  {
    slug: 'order-by',
    title: 'Sorting & Limiting Rows',
    summary: 'Order results with ORDER BY and compare MySQL LIMIT with T-SQL TOP.',
    sampleQuery: 'SELECT Name, CGPA\nFROM Student\nORDER BY CGPA DESC\nLIMIT 3;',
  },
];

export function HomePage() {
  const starterLaunchState: PlaygroundLaunchState = {
    query: 'SELECT Name, CGPA\nFROM Student\nWHERE CGPA > 3.42;',
    dialect: 'mysql',
    datasetId: 'university-demo-v1',
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            Interactive SQL Learning Laboratory
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Understand what every SQL clause means before you inspect the result.
          </h1>

          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            SQL Explorer pairs one universal SQL playground with structured concept
            briefings. Write a query in <strong className="font-semibold text-slate-800">MySQL</strong> or{' '}
            <strong className="font-semibold text-slate-800">Microsoft SQL Server (T-SQL)</strong>, inspect
            a plain-language breakdown of every clause, and reveal table rows on demand.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
            >
              <BookOpen className="h-4 w-4" />
              Start Learning
            </Link>

            <Link
              to="/playground"
              state={starterLaunchState}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            >
              <Code2 className="h-4 w-4" />
              Open Playground
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Learning Workflow Preview */}
      <section aria-labelledby="workflow-heading" className="space-y-4">
        <div>
          <h2 id="workflow-heading" className="text-lg font-semibold text-slate-900">
            How the learning loop works
          </h2>
          <p className="text-sm text-slate-600">
            Designed to help you reason about query structure rather than memorize syntax.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    STEP {item.step}
                  </span>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Beginner Topics */}
      <section aria-labelledby="topics-preview-heading" className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="topics-preview-heading" className="text-lg font-semibold text-slate-900">
              Start with core SQL concepts
            </h2>
            <p className="text-sm text-slate-600">
              Read a concise briefing or launch any example directly into the playground.
            </p>
          </div>
          <Link
            to="/learn"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all topics →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURED_TOPICS.map((topic) => (
            <div
              key={topic.slug}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">{topic.title}</h3>
                <p className="text-sm text-slate-600">{topic.summary}</p>
                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  {topic.sampleQuery}
                </pre>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
                <Link
                  to={`/learn/${topic.slug}`}
                  className="text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Read briefing
                </Link>
                <span className="text-slate-300">|</span>
                <Link
                  to="/playground"
                  state={
                    {
                      query: topic.sampleQuery,
                      dialect: 'mysql',
                      datasetId: 'university-demo-v1',
                      lessonSlug: topic.slug,
                      lessonTitle: topic.title,
                    } satisfies PlaygroundLaunchState
                  }
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Try in playground
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}