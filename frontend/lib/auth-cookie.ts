/**
 * Shared auth cookie name and options for JWT cookie-based auth.
 */
import { isDevelopmentEnvironment } from "./constants";

export const AUTH_COOKIE_NAME = "auth_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60, // 24 hours
};

export function getAuthCookieSetOptions() {
  return {
    ...COOKIE_OPTIONS,
    secure: !isDevelopmentEnvironment,
  };
}

export function getAuthCookieClearOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 0,
    secure: !isDevelopmentEnvironment,
  };
}
