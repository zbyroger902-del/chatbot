"""
JWT-based auth: create/verify tokens, login (guest + credentials stub).
"""
import os
import time
from typing import Literal

import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

UserType = Literal["guest", "regular"]

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_SECONDS = 24 * 60 * 60  # 24 hours


def _get_secret() -> str:
    secret = JWT_SECRET or os.getenv("JWT_SECRET")
    if not secret or len(secret) < 32:
        raise ValueError(
            "JWT_SECRET must be set and at least 32 characters. "
            "Generate with: openssl rand -base64 32"
        )
    return secret


def create_token(
    user_id: str,
    email: str,
    user_type: UserType,
) -> str:
    """Build JWT payload and sign with JWT_SECRET."""
    payload = {
        "sub": user_id,
        "email": email,
        "type": user_type,
        "exp": int(time.time()) + JWT_EXPIRY_SECONDS,
    }
    return jwt.encode(
        payload,
        _get_secret(),
        algorithm=JWT_ALGORITHM,
    )


def verify_token(token: str) -> dict | None:
    """Decode and verify JWT; return payload or None."""
    try:
        payload = jwt.decode(
            token,
            _get_secret(),
            algorithms=[JWT_ALGORITHM],
        )
        return payload
    except jwt.PyJWTError:
        return None


# Request body: { "guest": true } or { "email", "password" }
class LoginRequest(BaseModel):
    guest: bool | None = None
    email: str | None = None
    password: str | None = None


auth_router = APIRouter()


@auth_router.post("/login")
def login(request: LoginRequest):
    """
    POST /auth/login
    Body: { "guest": true } OR { "email": str, "password": str }.
    Guest returns a JWT; credentials return 401 until backend user store exists.
    """
    if request.guest is True:
        user_id = f"guest-{int(time.time() * 1000)}"
        token = create_token(
            user_id=user_id,
            email="guest@localhost",
            user_type="guest",
        )
        return {"token": token}

    if request.email and request.password:
        # Stub: no backend user store in v1; frontend will fall back to its DB
        raise HTTPException(status_code=401, detail="Credentials not supported yet")

    raise HTTPException(status_code=400, detail="Provide { guest: true } or { email, password }")
