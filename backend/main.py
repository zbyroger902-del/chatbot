"""
FastAPI app for the chatbot backend. LangGraph agent is used for chat.
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

import bcrypt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select

from agent.graph import run_agent
from auth import auth_router
from database import async_session_factory, engine
from models import Base, User


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed default admin user on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.username == "admin"))
        if result.scalar_one_or_none() is None:
            password_hash = bcrypt.hashpw(
                "password".encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("ascii")
            session.add(
                User(
                    username="admin",
                    email="admin@example.com",
                    password_hash=password_hash,
                )
            )
            await session.commit()
    yield
    await engine.dispose()


app = FastAPI(title="Chatbot Backend", lifespan=lifespan)

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
