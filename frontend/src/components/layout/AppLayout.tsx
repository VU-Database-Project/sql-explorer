import { BookOpen, Code2, Database } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { USE_MOCK_API } from '../../services/apiClient';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-600/30 ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 rounded-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                <Database className="h-4 w-4" />
              </span>
              <span className="text-base tracking-tight">SQL Explorer</span>
            </Link>

            <nav aria-label="Primary navigation" className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/learn" className={navLinkClass}>
                <BookOpen className="h-4 w-4" />
                Learn
              </NavLink>
              <NavLink to="/playground" className={navLinkClass}>
                <Code2 className="h-4 w-4" />
                Playground
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {USE_MOCK_API ? (
              <span
                title="Running against local typed mock responses (VITE_USE_MOCK_API=true)"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Mock API Mode
              </span>
            ) : (
              <span
                title="Connected to backend API"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Backend
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>SQL Explorer — Interactive SQL Learning Laboratory (Educational Sandbox)</p>
          <p>Uses synthetic university sample data only. Read-only SELECT subset.</p>
        </div>
      </footer>
    </div>
  );
}