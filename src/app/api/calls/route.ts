// src/app/api/calls/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const calls = await db.call.findMany({
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      hotelSlug: true,
      toolInvocations: {
        orderBy: { ts: "desc" },
        take: 1,
        select: {
          query: true,
          confidence: true,
          ts: true,
        },
      },
      feedback: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  const payload = calls.map((c) => ({
    id: c.id,
    startedAt: c.startedAt,
    hotelSlug: c.hotelSlug,
    latestTool: c.toolInvocations[0] ?? null,
    feedback: c.feedback ?? null,
  }));

  return NextResponse.json(payload);
}
