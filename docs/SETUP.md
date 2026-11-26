# Setup Guide

## 1. Install & Run Frontend
1. `git clone [https://github.com/VU-Database-Project/sql-explorer.git](https://github.com/VU-Database-Project/sql-explorer.git)`
2. `cd sql-explorer/frontend`
3. `npm install`
4. `cp .env.example .env`
5. `npm run dev` (opens http://localhost:5173/)

## 2. Verify TypeScript & Build
From `frontend/`, run `npx tsc --noEmit` and `npm run build`.

## 3. Connect to Live Backend
Set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env`, then restart `npm run dev`.
