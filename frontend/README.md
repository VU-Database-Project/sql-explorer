# SQL Explorer — Frontend

React + TypeScript + Vite web interface for **SQL Explorer**, supporting **MySQL (`mysql`)** and **Microsoft SQL Server (`tsql`)**.

## Setup & Run
1. `cd frontend`
2. `npm install`
3. `cp .env.example .env`
4. `npm run dev` (opens http://localhost:5173/)

## Environment Variables (`frontend/.env`)
- `VITE_USE_MOCK_API=true` — Uses local typed mock fixtures (`src/services/mockApi.ts`). Set to `false` for the live backend.
- `VITE_API_BASE_URL=http://localhost:4000` — Backend HTTP server URL when mock mode is off.
