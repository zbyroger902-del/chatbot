import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import * as jose from "jose";

export type UserType = "guest" | "regular";

export type Session = {
  user: {
    id: string;
    email?: string | null;
    type: UserType;
    name?: string | null;
    image?: string | null;
  };
  expires: string;
};

export type User = {
  id?: string;
  email?: string | null;
  type: UserType;
};

const COOKIE_NAME = "auth_token";
const MOCK_USER: Session["user"] = {
  id: "local-user",
  email: "local@localhost",
  type: "guest",
};

const MOCK_SESSION: Session = {
  user: { ...MOCK_USER },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return new Uint8Array(0);
  }
  return new TextEncoder().encode(secret);
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return MOCK_SESSION;
  }
  const secret = getJwtSecret();
  if (secret.length === 0) {
    return MOCK_SESSION;
  }
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub ?? "local-user";
    const email = (payload.email as string) ?? "local@localhost";
    const type = (payload.type as UserType) ?? "guest";
    const exp = payload.exp ?? Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    return {
      user: { id: sub, email, type, name: null, image: null },
      expires: new Date(exp * 1000).toISOString(),
    };
  } catch {
    return MOCK_SESSION;
  }
}

type SignInOptions = {
  redirect?: boolean;
  redirectTo?: string;
  callbackUrl?: string;
  email?: string;
  password?: string;
};

export function signIn(
  provider: string,
  options?: SignInOptions
): never {
  if (provider === "guest") {
    const url = `/api/auth/guest?redirectUrl=${encodeURIComponent(options?.redirectTo ?? options?.callbackUrl ?? "/")}`;
    redirect(url);
  }
  if (provider === "credentials") {
    redirect(options?.callbackUrl ?? "/login");
  }
  redirect("/login");
}

type SignOutOptions = {
  redirectTo?: string;
  callbackUrl?: string;
};

export function signOut(options?: SignOutOptions): never {
  const callbackUrl = options?.redirectTo ?? options?.callbackUrl ?? "/login";
  redirect(`/api/auth/signout?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
