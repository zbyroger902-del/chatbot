# Chatbot

Full-stack conversational AI app: Next.js chat UI with an agentic Python backend powered by LangGraph.

## View

- **Frontend**: Modern chat interface (Next.js 16, AI SDK, shadcn/ui) with auth, history, file uploads, and streaming.
- **Backend**: FastAPI service with a LangGraph agent core—designed to grow from a simple echo into RAG, tools, and multi-step reasoning.
- **Goal**: One codebase for a production-ready chatbot you can extend with your own data, tools, and model providers.

## Roadmap

- [x] Next.js app with chat UI, auth, and AI SDK integration
- [x] FastAPI + LangGraph backend with placeholder agent
- [x] Document and file upload APIs
- [ ] Connect frontend to backend agent (replace or complement AI Gateway)
- [ ] Replace placeholder agent with LLM + optional RAG/tools
- [ ] Optional: deploy backend (e.g. Vercel serverless or separate host) and wire env

## Project layout

```
chatbot/
├── frontend/          # Next.js app (app, components, lib, hooks, etc.); only node_modules lives here
├── backend/           # FastAPI + LangGraph Python service
├── .github/           # CI workflows
├── package.json       # Root scripts run commands in frontend/
└── README.md
```

All frontend code and dependencies live under `frontend/`. Root `package.json` scripts run commands inside `frontend/` (e.g. `pnpm dev`, `pnpm build` from root), so you still run everything from the repo root. The only `node_modules` is `frontend/node_modules/`.

## Usage

### Frontend (Next.js)

From the project root, `pnpm install` runs the install script and installs frontend dependencies (into `frontend/node_modules/`). You can also run `cd frontend && pnpm install` directly.

```bash
pnpm install
cp .env.example frontend/.env.local   # then fill in secrets
pnpm db:migrate                       # setup or apply DB migrations
pnpm dev
```

App runs at [http://localhost:3001](http://localhost:3001). Use the variables in `.env.example` (e.g. `AUTH_SECRET`, `AI_GATEWAY_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `POSTGRES_URL`) in `frontend/.env.local` and do not commit it.

To run frontend-only commands from the frontend directory:

```bash
cd frontend
pnpm install   # if you didn’t run from root
pnpm dev
```

### Backend (FastAPI + LangGraph)

Start the database first (see [Database (Docker)](#database-docker) below), then:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL (e.g. export DATABASE_URL=postgresql+asyncpg://chatbot:chatbot@localhost:5433/chatbot)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Chat: `POST http://localhost:8000/chat` with JSON body `{"message": "..."}` or `{"messages": [...]}`

See `backend/README.md` for backend-only setup details (e.g. Aliyun mirror).

### Database (Docker)

The backend uses PostgreSQL (with pgvector for future vector storage). The container exposes **port 5433** on the host to avoid conflicting with another Postgres (e.g. Dify) on 5432. Run the DB with Docker Desktop:

```bash
docker compose up -d db
```

Set backend env in `backend/.env` (or export in the shell). The backend loads `backend/.env` on startup. Copy from `backend/.env.example` and fill in:

```bash
# backend/.env
JWT_SECRET=your-secret-at-least-32-chars   # e.g. openssl rand -base64 32
DATABASE_URL=postgresql+asyncpg://chatbot:chatbot@localhost:5433/chatbot
```

**Schema, tables, and default user:** When the backend starts, it creates the schema and tables (from [backend/models.py](backend/models.py)) and seeds a default user if missing. This happens in the FastAPI lifespan in [backend/main.py](backend/main.py) (create_all + admin seed). No separate migration or seed step is required.

Default login credentials (seeded on first backend startup): **admin** / **password**. Use these in the frontend login (email-or-username field: `admin`, password: `password`).

## Build and CI

- **Build**: `pnpm build` (uses webpack; Turbopack is used only for `pnpm dev` in the frontend app).
- **Lint**: `pnpm lint`
- **Tests**: `pnpm test` (Playwright e2e; runs from root and targets the frontend app).

## Deploying

- **Vercel**: Set the project’s **Root Directory** to `frontend` in the Vercel dashboard so the Next.js app is built from there.

## License

MIT
