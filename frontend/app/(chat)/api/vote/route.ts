import { getSession } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

/** Stub: returns empty votes for detached frontend. Connect your backend for real data. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter chatId is required."
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:vote").toResponse();
  }

  return Response.json([], { status: 200 });
}

/** Stub: no-op for detached frontend. */
export async function PATCH(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:vote").toResponse();
  }

  return new Response("Message voted", { status: 200 });
}
