import { NextResponse } from "next/server";
import { compareSync } from "bcrypt-ts";
import * as jose from "jose";
import { getUser } from "@/lib/db/queries";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieSetOptions,
} from "@/lib/auth-cookie";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const JWT_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours
const JWT_SECRET_MIN_LENGTH = 32;

function credentialErrorResponse(request: Request, error: string) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  if (isForm) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );
}

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < JWT_SECRET_MIN_LENGTH) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

async function createToken(
  userId: string,
  email: string,
  type: "guest" | "regular"
): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }
  const exp = Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS;
  const token = await new jose.SignJWT({
    email,
    type,
  })
    .setSubject(userId)
    .setExpirationTime(exp)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
  return token;
}

function getRedirectUrl(request: Request, defaultPath: string): string {
  const url = new URL(request.url);
  return url.searchParams.get("redirectUrl") ?? defaultPath;
}

function isFormRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

function successResponse(
  request: Request,
  token: string,
  redirectUrl: string
): NextResponse {
  const response = isFormRequest(request)
    ? NextResponse.redirect(new URL(redirectUrl, request.url))
    : NextResponse.json({ url: redirectUrl });
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieSetOptions());
  return response;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let body: { guest?: boolean; email?: string; password?: string };
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = {
      email: (formData.get("email") as string) ?? undefined,
      password: (formData.get("password") as string) ?? undefined,
    };
  } else {
    try {
      body = (await request.json()) as {
        guest?: boolean;
        email?: string;
        password?: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
  }

  if (body.guest === true) {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest: true }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Guest login failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { token?: string };
    const token = data.token;
    if (!token) {
      return NextResponse.json(
        { error: "No token from backend" },
        { status: 502 }
      );
    }
    return successResponse(request, token, getRedirectUrl(request, "/"));
  }

  if (body.email && body.password) {
    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    if (backendRes.ok) {
      const data = (await backendRes.json()) as { token?: string };
      const token = data.token;
      if (token) {
        return successResponse(
          request,
          token,
          getRedirectUrl(request, "/")
        );
      }
    }

    const [user] = await getUser(body.email);
    if (!user || !user.password) {
      return credentialErrorResponse(request, "invalid_credentials");
    }
    const valid = compareSync(body.password, user.password);
    if (!valid) {
      return credentialErrorResponse(request, "invalid_credentials");
    }
    const token = await createToken(
      user.id,
      user.email,
      "regular"
    );
    return successResponse(
      request,
      token,
      getRedirectUrl(request, "/")
    );
  }

  return NextResponse.json(
    { error: "Provide { guest: true } or { email, password }" },
    { status: 400 }
  );
}
