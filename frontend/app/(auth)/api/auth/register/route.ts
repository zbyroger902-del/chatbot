import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, getUser } from "@/lib/db/queries";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieSetOptions,
} from "@/lib/auth-cookie";
import * as jose from "jose";

const JWT_EXPIRY_SECONDS = 24 * 60 * 60;
const JWT_SECRET_MIN_LENGTH = 32;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let body: { email?: string; password?: string };
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    body = {
      email: (formData.get("email") as string) ?? undefined,
      password: (formData.get("password") as string) ?? undefined,
    };
  } else {
    try {
      body = (await request.json()) as { email?: string; password?: string };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.redirect(
      new URL("/register?error=invalid_data", request.url)
    );
  }

  const [existing] = await getUser(parsed.data.email);
  if (existing) {
    return NextResponse.redirect(
      new URL("/register?error=user_exists", request.url)
    );
  }

  try {
    await createUser(parsed.data.email, parsed.data.password);
  } catch {
    return NextResponse.redirect(
      new URL("/register?error=failed", request.url)
    );
  }

  const [user] = await getUser(parsed.data.email);
  if (!user) {
    return NextResponse.redirect(
      new URL("/register?error=failed", request.url)
    );
  }

  const token = await createToken(user.id, user.email, "regular");
  const redirectUrl =
    new URL(request.url).searchParams.get("redirectUrl") ?? "/";
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieSetOptions());
  return response;
}
