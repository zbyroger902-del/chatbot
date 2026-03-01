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
├── frontend/          # Next.js app (app, components, lib, hooks, etc.)
├── backend/           # FastAPI + LangGraph Python service
├── .github/           # CI workflows
├── package.json       # Root scripts (dev, build, lint, test, db:*)
├── pnpm-workspace.yaml
└── README.md
```

All frontend code lives under `frontend/`. Root `package.json` delegates to the frontend package so you can still run `pnpm dev`, `pnpm build`, etc. from the repo root.

## Usage

### Frontend (Next.js)

From the project root:

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

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Chat: `POST http://localhost:8000/chat` with JSON body `{"message": "..."}` or `{"messages": [...]}`

See `backend/README.md` for backend-only setup details (e.g. Aliyun mirror).

## Build and CI

- **Build**: `pnpm build` (uses webpack; Turbopack is used only for `pnpm dev` in the frontend package).
- **Lint**: `pnpm lint`
- **Tests**: `pnpm test` (Playwright e2e; runs from root and targets the frontend app).

## Deploying

- **Vercel**: Set the project’s **Root Directory** to `frontend` in the Vercel dashboard so the Next.js app is built from there.

## License

MIT
