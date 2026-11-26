# Implementation Notes

## Implemented
- Full React + TypeScript + Vite frontend with Home, Learn, Topic Detail, and Universal Playground pages.
- MySQL (`mysql`) and T-SQL (`tsql`) dialect switching, CodeMirror 6 highlighting, 300ms debounced analysis, concept chips, clause breakdowns, explicit result reveal, stale-result warnings, and collapsible schema reference.

## Currently Mocked
- With `VITE_USE_MOCK_API=true`, `mockApi.ts` and `mockData.ts` simulate 3 beginner topics (`select`, `where`, `order-by`) and golden test queries against synthetic `university-demo-v1` `Student` rows.
- `POST /api/query/compare` is not implemented yet; Compare Dialects shows a static syntax reference.

## Next Steps
1. Implement backend endpoints matching `docs/FRONTEND_SPECIFICATION.md`.
2. Finalize `university-demo-v1` database tables and seed data.
3. Set `VITE_USE_MOCK_API=false` in `frontend/.env` and verify end-to-end.
