"""
FastAPI app for the chatbot backend. LangGraph agent is used for chat.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.graph import run_agent
from auth import auth_router

app = FastAPI(title="Chatbot Backend")

if not os.getenv("JWT_SECRET") and os.getenv("ENV", "development") != "development":
    raise ValueError("JWT_SECRET must be set in non-development environments")

app.include_router(auth_router, prefix="/auth", tags=["auth"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str | None = None
    messages: list[dict] | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(request: ChatRequest):
    """Placeholder chat endpoint: runs the LangGraph agent and returns a reply."""
    if request.messages:
        last_user = next(
            (m for m in reversed(request.messages) if m.get("role") == "user"),
            None,
        )
        content = last_user.get("content", "") if last_user else ""
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = " ".join(
                p.get("text", "") for p in content if isinstance(p, dict)
            )
        else:
            text = ""
    else:
        text = request.message or ""

    reply = run_agent(text)
    return {"reply": reply}
