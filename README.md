# More-of-Less Studio

**AI audio/video studio for creators — no technical skills required.**

Turn a song, an idea, and a character description into a finished music video, visualizer, or cinematic scene. Runs entirely on open-source models; provider API keys never leave your server.

---

## What it is

More-of-Less is a white-label AI creative studio built on top of the Open Generative AI platform. It gives non-technical creators a clean, opinionated UI for the jobs that AI media tools make painful:

| Studio | What it does |
|---|---|
| **Music Video** | Upload a song → set style/theme → generates beat-synced scenes end-to-end |
| **Visualizer** | Waveform, spectrum, lyrics kinetic typography, character-reactive portraits, and more |
| **Mix & Master** | AI mastering with loudness targets, autotune, and vocal/bass controls |
| **Character Lab** | Build a Character Passport — consistent characters across every scene via prompt anchors, LoRA trigger words, and seed policy |
| **Workflow Monitor** | Real-time SSE job tracking across all studio pages |

**Provider waterfall (automatic fallback):**
`local → HuggingFace → ComfyUI → fal.ai → Muapi → stub`

Every job is durable — survives server restarts with explicit state transitions. Every media operation goes through a job ID, status stream, and artifact record.

---

## Deploy anywhere

### Option A — Vercel (frontend) + Railway (API) — recommended

The frontend is a Next.js app that deploys to Vercel in one click. The API is a pure Node.js HTTP server that deploys to Railway, Render, or any container host.

**Frontend → Vercel**

1. Fork this repo
2. Import into [vercel.com/new](https://vercel.com/new)
3. Set environment variable: `NEXT_PUBLIC_API_BASE_URL=https://your-api.railway.app`
4. Deploy

**API → Railway**

```bash
npm install -g @railway/cli
railway login
railway init
railway up --dockerfile Dockerfile.api
railway variables set HF_TOKEN=hf_xxx FAL_KEY=xxx MUAPI_KEY=xxx
```

---

### Option B — Docker Compose (Coolify / Hostinger / any VPS)

Runs the full stack — Next.js frontend + Node.js API — in one container.

```bash
# 1. Clone
git clone https://github.com/executiveusa/pauli-Open-Generative-AI
cd pauli-Open-Generative-AI

# 2. Configure
cp .env.production.example .env.production
# Edit .env.production — at minimum set NEXT_PUBLIC_API_BASE_URL

# 3. Run
docker compose up -d

# Open http://localhost:3000
```

**Coolify:** Create a new service → Docker Compose → paste the repo URL → point to `docker-compose.yml` → set env vars in the Coolify dashboard → deploy.

**Hostinger VPS:** SSH in, install Docker, clone the repo, follow the Docker Compose steps above. Optionally put Nginx in front for HTTPS.

---

### Option C — Local development

```bash
# Install dependencies
npm install
npm run build:packages

# Terminal 1 — API server
node apps/api/src/index.js

# Terminal 2 — Next.js dev server
npm run dev

# Open http://localhost:3000
```

---

## Environment variables

All provider keys are **server-side only** — they never reach the browser. The only public variable is the API base URL.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | URL of the API server, visible to the browser |
| `API_PORT` | No | API server port (default `8000`) |
| `PORT` | No | Next.js server port (default `3000`) |
| `STORAGE_ROOT` | No | Directory for uploaded files and job artifacts |
| `DATABASE_URL` | No | SQLite path or Postgres URL |
| `HF_ENABLED` | No | Enable HuggingFace Inference API |
| `HF_TOKEN` | No | HuggingFace API token — server only |
| `FAL_ENABLED` | No | Enable fal.ai video generation |
| `FAL_KEY` | No | fal.ai API key — server only |
| `FAL_MAX_COST_PER_JOB_USD` | No | Per-job cost cap for fal.ai |
| `MUAPI_ENABLED` | No | Enable Muapi image/video/lip-sync |
| `MUAPI_KEY` | No | Muapi API key — server only |
| `COMFYUI_ENABLED` | No | Enable local ComfyUI worker |
| `COMFYUI_BASE_URL` | No | ComfyUI base URL |
| `LTX_ENABLED` | No | Enable local LTX video worker |
| `LTX_WORKER_BASE_URL` | No | LTX worker base URL |
| `LOG_LEVEL` | No | `info` / `debug` / `error` |

See `.env.production.example` for a full template.

---

## Security model

- `HF_TOKEN`, `FAL_KEY`, and `MUAPI_KEY` are never sent to the browser
- All provider calls go through the backend API only
- Secret-shaped strings are redacted in error logs (`hf_*`, `fal_*`, `sk-*`, `nvapi-*` → `[REDACTED]`)
- The only allowed public environment variable is `NEXT_PUBLIC_API_BASE_URL`

---

## White-labeling

Rename the studio by setting these public variables (no rebuild needed for the API; frontend rebuild required):

```env
NEXT_PUBLIC_BRAND_NAME=Your Studio Name
NEXT_PUBLIC_BRAND_TAGLINE=Your tagline
NEXT_PUBLIC_BRAND_DESCRIPTION=Your description
NEXT_PUBLIC_BRAND_ACCENT=violet
```

---

## Project structure

```
├── app/mol/                  Next.js App Router — studio pages
│   ├── dashboard/            Bento 2.0 overview
│   ├── music-video/          Beat-synced music video generator
│   ├── visualizer/           Audio visualizer builder
│   ├── mix-master/           AI mix & master
│   ├── character-lab/        Character Passport creator
│   └── workflow-monitor/     Real-time job tracker
├── apps/api/                 Pure Node.js HTTP API server
│   └── src/
│       ├── routes/           health, jobs, projects, assets, characters
│       └── services/         job runner, provider waterfall, FFmpeg wrapper
├── apps/workers/models/      Provider adapters
│   ├── huggingface/
│   ├── fal/
│   └── muapi/
├── components/mol/           Shared React components (FileUploader, JobMonitor)
├── lib/                      apiClient, brandConfig
├── packages/studio/          Shared UI component library
├── stubs/                    Build-time stubs for optional git submodule packages
├── Dockerfile                Combined image (frontend + API) for Coolify/VPS
├── Dockerfile.api            API-only image for Railway/Render
├── docker-compose.yml        Full-stack self-hosted deployment
└── railway.toml              Railway deployment config
```

---

## API reference

The API runs at `http://localhost:8000` by default. All routes are under `/v1/`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/health` | Health check + provider status |
| `POST` | `/v1/projects` | Create a project |
| `GET` | `/v1/projects/:id` | Get project |
| `POST` | `/v1/projects/:id/assets` | Upload a file asset |
| `GET` | `/v1/projects/:id/assets` | List assets |
| `POST` | `/v1/projects/:id/characters` | Create a Character Passport |
| `GET` | `/v1/projects/:id/characters` | List characters |
| `POST` | `/v1/jobs` | Create a job (music-video, visualizer, mix-master, etc.) |
| `GET` | `/v1/jobs/:id` | Get job status |
| `GET` | `/v1/jobs/:id/events` | SSE stream of job events |

---

## Development

```bash
# Run tests
node --test apps/workers/models/huggingface/tests/*.test.mjs
node --test apps/workers/models/fal/tests/*.test.mjs
node --test apps/workers/models/muapi/tests/*.test.mjs

# Lint
npm run lint

# Build production
npm run build:packages && npm run build
```

---

## License

MIT — fork it, rebrand it, ship it.
