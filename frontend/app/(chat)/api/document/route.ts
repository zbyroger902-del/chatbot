import { getSession } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

/** Stub: returns 404 for detached frontend. Connect your backend for real documents. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter id is missing"
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:document").toResponse();
  }

  return new ChatbotError("not_found:document").toResponse();
}

/** Stub: no-op for detached frontend. */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const body = await request.json().catch(() => ({}));
  return Response.json(
    {
      id: body.id ?? "stub",
      title: body.title ?? "",
      kind: body.kind ?? "text",
      content: body.content ?? "",
      userId: session.user.id,
      createdAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}

/** Stub: no-op for detached frontend. */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get("id") || !searchParams.get("timestamp")) {
    return new ChatbotError(
      "bad_request:api",
      "Parameter id and timestamp are required."
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:document").toResponse();
  }

  return Response.json([], { status: 200 });
}
