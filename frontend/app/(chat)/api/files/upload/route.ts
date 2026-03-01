import { NextResponse } from "next/server";
import { getSession } from "@/app/(auth)/auth";

/** Stub: returns a placeholder URL for detached frontend. Connect your backend or Vercel Blob for real uploads. */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  return NextResponse.json({
    url: "#",
    pathname: "stub",
  });
}
