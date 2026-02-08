// src/app/api/calls/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CallIdParamSchema } from "@/lib/validators";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

type RetrievedShape = {
  answerDraft?: string;
  confidence?: number;
  snippets?: Array<{
    title: string;
    text: string;
    sourceUrl: string;
    hotelSlug?: string | null;
  }>;
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;

  const parsed = CallIdParamSchema.safeParse({ id: params.id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid call id" }, { status: 400 });
  }

  const call = await db.call.findUnique({
    where: { id: parsed.data.id },
    include: {
      messages: { orderBy: { ts: "asc" } },
      toolInvocations: { orderBy: { ts: "asc" } },
      feedback: true, // singular relation
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const toolInvocations = call.toolInvocations.map((ti) => {
    const parsedResults = safeJsonParse<RetrievedShape>(ti.resultsJson);
    return {
      id: ti.id,
      query: ti.query,
      confidence: ti.confidence,
      ts: ti.ts,
      answerDraft: parsedResults?.answerDraft ?? null,
      snippets: parsedResults?.snippets ?? [],
    };
  });

  return NextResponse.json({
    id: call.id,
    startedAt: call.startedAt,
    hotelSlug: call.hotelSlug,
    status: call.status,
    messages: call.messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      ts: m.ts,
    })),
    toolInvocations,
    feedback: call.feedback ?? null,
  });
}

