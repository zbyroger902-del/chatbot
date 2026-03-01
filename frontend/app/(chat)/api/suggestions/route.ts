import { getSession } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

/** Stub: returns empty suggestions for detached frontend. Connect your backend for real data. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter documentId is required."
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:suggestions").toResponse();
  }

  return Response.json([], { status: 200 });
}
