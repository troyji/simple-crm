# SimpleCRM

A small CRM app: leads, opportunities, pipeline stages, monthly forecast, custom fields.

## Requirements

- Node.js 20+
- npm 10+

## Install

```sh
npm install
```

## Run

```sh
npm run dev
```

That single command starts both processes:

- **API server** on http://localhost:3000 (Express + TypeORM + SQLite, via `nodemon` + `ts-node`)
- **Web client** on http://localhost:5173 (React + Vite, proxies `/api/*` to the server)

Open http://localhost:5173 in your browser.

## Test

```sh
npm test
```

Runs all tests across both workspaces. For watch mode during development, run from within a workspace:

```sh
cd code/server && npx vitest   # server tests in watch mode
cd code/client && npx vitest   # client tests in watch mode
```

## Other scripts

| From the repo root | What it does |
| --- | --- |
| `npm run build` | Builds both packages |
| `npm run typecheck` | Type-checks both packages |
| `npm run lint` | Lints the client |

## Layout

```
code/
  client/   React + Vite frontend
  server/   Express + TypeORM API
```
