import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getSession } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { ChatbotError } from "@/lib/errors";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  let chat: Awaited<ReturnType<typeof getChatById>> = null;
  let messagesFromDb: Awaited<ReturnType<typeof getMessagesByChatId>> = [];

  try {
    chat = await getChatById({ id });
    if (!chat) {
      redirect("/");
    }
    if (chat.visibility === "private" && session.user?.id !== chat.userId) {
      redirect("/");
    }
    messagesFromDb = await getMessagesByChatId({ id });
  } catch (error) {
    if (
      error instanceof ChatbotError &&
      error.message?.includes("Database not configured")
    ) {
      chat = null;
    } else {
      throw error;
    }
  }

  if (!chat) {
    redirect("/");
  }

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          autoResume={true}
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={uiMessages}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler />
    </>
  );
}
