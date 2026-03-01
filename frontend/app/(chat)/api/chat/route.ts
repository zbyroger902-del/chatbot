import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import type { LanguageModel } from "ai";
import { getSession } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

/** Stub model for detached frontend. Replace with real model when connecting your backend. */
const stubModel: LanguageModel = {
  specificationVersion: "v3",
  provider: "stub",
  modelId: "stub",
  defaultObjectGenerationMode: "tool",
  supportedUrls: {},
  doGenerate: async () => ({
    finishReason: "stop",
    usage: {
      inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 1, text: 1, reasoning: 0 },
    },
    content: [
      {
        type: "text",
        text: "Backend not connected. Connect your own backend to enable AI.",
      },
    ],
    warnings: [],
  }),
  doStream: () => ({
    stream: new ReadableStream({
      start(controller) {
        const text =
          "Backend not connected. Connect your own backend to enable AI.";
        controller.enqueue({ type: "text-start", id: "t1" });
        controller.enqueue({ type: "text-delta", id: "t1", delta: text });
        controller.enqueue({ type: "text-end", id: "t1" });
        controller.enqueue({
          type: "finish",
          finishReason: "stop",
          usage: {
            inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 1, text: 1, reasoning: 0 },
          },
        });
        controller.close();
      },
    }),
  }),
} as unknown as LanguageModel;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const { id, message } = requestBody;

    const session = await getSession();

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: stubModel,
          messages:
            message?.role === "user"
              ? [{ role: "user", content: message.parts.map((p) => ("text" in p ? p.text : p.url)).join(" ") }]
              : [],
        });
        dataStream.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  return Response.json({ id }, { status: 200 });
}
