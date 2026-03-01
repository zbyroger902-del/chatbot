import NextAuth, { type DefaultSession, type Session } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

/** Mock user for detached frontend (no DB). Replace with real providers when connecting your backend. */
const MOCK_USER = {
  id: "local-user",
  email: "local@localhost",
  type: "guest" as UserType,
};

/** Session fallback when no cookie: chat always has a user so login is not required. */
const MOCK_SESSION: Session = {
  user: { ...MOCK_USER },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/** Use in chat routes/layout so unauthenticated requests get mock session; no sign-in required. */
export async function getSession() {
  const session = await auth();
  return session ?? MOCK_SESSION;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        return MOCK_USER;
      },
    }),
    Credentials({
      credentials: {},
      async authorize() {
        return MOCK_USER;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }

      return session;
    },
  },
});
