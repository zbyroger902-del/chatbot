import type { NextRequest } from "next/server";
import { getSession } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

/** Stub: returns empty history for detached frontend. Connect your backend for real data. */
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  return Response.json({ chats: [], hasMore: false });
}

/** Stub: no-op for detached frontend. */
export async function DELETE() {
  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  return Response.json({ deletedCount: 0 }, { status: 200 });
}
