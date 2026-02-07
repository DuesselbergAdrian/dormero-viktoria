import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inferHotelSlugFromQuery } from '@/lib/hotelMatch';
import { retrieveAnswer } from '@/lib/retrieval';
import { AgentSearchInputSchema } from '@/lib/validators';

export async function POST(req: Request) {
  const startedAt = new Date();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AgentSearchInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { query } = parsed.data;
  const inferredHotelSlug = parsed.data.hotelSlug ?? inferHotelSlugFromQuery(query) ?? undefined;

  // Retrieval (grounded snippets + confidence + short draft)
  const retrieved = await retrieveAnswer({
    query,
    hotelSlug: inferredHotelSlug,
  });

  // Create Call if missing
  const callId =
    parsed.data.callId ??
    (
      await db.call.create({
        data: {
          startedAt,
          hotelSlug: inferredHotelSlug,
          status: 'open',
        },
        select: { id: true },
      })
    ).id;

  // Log tool invocation (store whole response for traceability)
  await db.toolInvocation.create({
    data: {
      callId,
      query,
      resultsJson: JSON.stringify(retrieved),
      confidence: retrieved.confidence,
      ts: new Date(),
    },
  });

  return NextResponse.json({
    callId,
    answerDraft: retrieved.answerDraft,
    snippets: retrieved.snippets,
    confidence: retrieved.confidence,
  });
}
