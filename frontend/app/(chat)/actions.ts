"use server";

import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

/** Stub: returns static title for detached frontend. Connect your backend for AI-generated titles. */
export async function generateTitleFromUserMessage(_args: {
  message: { parts?: unknown[] };
}) {
  return "New Chat";
}

/** Stub: no-op for detached frontend. */
export async function deleteTrailingMessages(_args: { id: string }) {
  return;
}

/** Stub: no-op for detached frontend. */
export async function updateChatVisibility(_args: {
  chatId: string;
  visibility: VisibilityType;
}) {
  return;
}
