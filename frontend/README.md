# Interview Room

An adaptive mock-interview web app. A candidate takes a live interview that
adapts its questions and difficulty to their answers, then receives an honest,
scored report. Three surfaces: `/practice` (candidate runner), `/cohort`
(institution dashboards), and `/screen` (recruiter review).

The app runs **fully in the browser by default** — a contract-faithful mock
drives the interview and auth, so no backend and no configuration are required
to get started.

## Getting started

### Prerequisites

- **Node.js 20.9 or newer** (see `.nvmrc`; run `nvm use` if you use nvm).

### Run it

```bash
git clone https://github.com/sirohideepanshu/ai-mock-interview.git
cd ai-mock-interview
npm install
npm run dev
```

> Run every command from inside the folder that contains `package.json` (this
> `ai-mock-interview` folder). Running from a parent folder is the most common
> cause of "it doesn't work".

Then open <http://localhost:3000>. You should see the landing page with the
headline **"Practice the part that's actually hard — the follow-ups."**

> **Troubleshooting:** If you instead see the default Next.js starter page
> ("Get started by editing…"), you are running from the wrong folder — `cd`
> into the `ai-mock-interview` folder (the one with `package.json`) and run
> `npm run dev` again.

## Configuration (optional)

No environment file is needed — every variable has a working default. To
override one (for example, to point at a real backend), copy the example and
edit it:

```bash
cp .env.example .env.local
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCK` | `true` | In-browser mock interview transport. Set `false` to use a real WebSocket. |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws/interview` | Interview server endpoint (used only when the mock is off). |
| `NEXT_PUBLIC_USE_MOCK_AUTH` | `true` | In-memory mock auth. Set `false` only once a real provider exists. |

`.env.local` is gitignored — never commit real secrets.

## Scripts

- `npm run dev` — start the dev server at <http://localhost:3000>.
- `npm run build` — production build.
- `npm run start` — serve the production build (run `build` first).
- `npm run lint` — lint the project.
