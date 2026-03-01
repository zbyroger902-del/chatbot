"use server";

import { z } from "zod";

import { createUser, getUser } from "@/lib/db/queries";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

/**
 * Not used by login page (form POSTs to /api/auth/callback/login).
 * Kept for programmatic use; cookie must be set by client posting to the API.
 */
export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  const parsed = authFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "invalid_data" };
  }
  return { status: "failed" };
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

/**
 * Not used by register page (form POSTs to /api/auth/register).
 * Kept for programmatic user creation only (does not set session cookie).
 */
export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  const parsed = authFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "invalid_data" };
  }
  const [existing] = await getUser(parsed.data.email);
  if (existing) {
    return { status: "user_exists" };
  }
  try {
    await createUser(parsed.data.email, parsed.data.password);
    return { status: "success" };
  } catch {
    return { status: "failed" };
  }
};
