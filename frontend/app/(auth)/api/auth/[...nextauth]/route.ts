import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieClearOptions,
} from "@/lib/auth-cookie";
import { getSession } from "@/app/(auth)/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth: segments } = await context.params;
  const path = segments.at(0) ?? "";

  if (path === "session") {
    const session = await getSession();
    return NextResponse.json(session);
  }

  if (path === "signout") {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get("callbackUrl") ?? "/login";
    const res = NextResponse.redirect(new URL(callbackUrl, request.url));
    res.cookies.set(AUTH_COOKIE_NAME, "", getAuthCookieClearOptions());
    return res;
  }

  if (path === "signin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "providers") {
    return NextResponse.json({
      guest: { id: "guest", name: "Guest", type: "credentials" },
      credentials: { id: "credentials", name: "Credentials", type: "credentials" },
    });
  }

  return NextResponse.json({}, { status: 404 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth: segments } = await context.params;
  const path = segments.at(0) ?? "";

  if (path === "signout") {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get("callbackUrl") ?? "/login";
    const res = NextResponse.redirect(new URL(callbackUrl, request.url));
    res.cookies.set(AUTH_COOKIE_NAME, "", getAuthCookieClearOptions());
    return res;
  }

  return NextResponse.json({}, { status: 404 });
}
