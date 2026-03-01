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

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const STUB_MESSAGE =
  "Backend not connected. Connect your own backend to enable AI.";

function makeTextModel(text: string): LanguageModel {
  return {
    specificationVersion: "v3",
    provider: "backend",
    modelId: "backend",
    defaultObjectGenerationMode: "tool",
    supportedUrls: {},
    doGenerate: async () => ({
      finishReason: "stop",
      usage: {
        inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: text.length, text: text.length, reasoning: 0 },
      },
      content: [{ type: "text", text }],
      warnings: [],
    }),
    doStream: () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: "text-start", id: "t1" });
          controller.enqueue({ type: "text-delta", id: "t1", delta: text });
          controller.enqueue({ type: "text-end", id: "t1" });
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: {
              inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
              outputTokens: {
                total: text.length,
                text: text.length,
                reasoning: 0,
              },
            },
          });
          controller.close();
        },
      }),
    }),
  } as unknown as LanguageModel;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const { message } = requestBody;

    const session = await getSession();

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const userText =
      message?.role === "user"
        ? message.parts
            .map((p) => ("text" in p ? p.text : p.url))
            .join(" ")
        : "";

    let replyText = STUB_MESSAGE;
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        if (typeof data.reply === "string") {
          replyText = data.reply;
        }
      }
    } catch {
      replyText = STUB_MESSAGE;
    }

    const model = makeTextModel(replyText);
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model,
          messages: userText ? [{ role: "user", content: userText }] : [],
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
