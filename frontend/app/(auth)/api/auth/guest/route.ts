import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieSetOptions,
} from "@/lib/auth-cookie";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") ?? "/";

  const cookieStore = await cookies();
  const existing = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (existing) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guest: true }),
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const data = (await res.json()) as { token?: string };
  const token = data.token;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieSetOptions());
  return response;
}
