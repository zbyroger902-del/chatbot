# Chat backend (FastAPI + LangGraph)

Minimal FastAPI backend with LangGraph as the agent core. Ready to be wired to the Next.js chatbot frontend.

## Setup

### 1. Create virtual environment

From the project root or from `backend/`:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

### 2. Install dependencies (use Aliyun mirror in China)

```bash
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

To make the mirror default for this project only:

```bash
pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/
pip install -r requirements.txt
```

### 3. Run the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/health  
- Chat: `POST http://localhost:8000/chat` with JSON body `{"message": "..."}` or `{"messages": [...]}`

## Project layout

- `main.py` – FastAPI app, `/health`, `/chat` (placeholder).
- `agent/graph.py` – LangGraph agent skeleton (single-node echo); replace with your agent logic.
