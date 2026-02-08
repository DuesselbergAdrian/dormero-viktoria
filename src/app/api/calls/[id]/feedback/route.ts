// src/app/api/calls/[id]/feedback/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CallIdParamSchema, FeedbackInputSchema } from "@/lib/validators";
import { Prisma } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;

  const idParsed = CallIdParamSchema.safeParse({ id: params.id });
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid call id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const bodyParsed = FeedbackInputSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: "Invalid feedback", issues: bodyParsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const feedback = await db.feedback.upsert({
      where: { callId: idParsed.data.id },
      create: {
        callId: idParsed.data.id,
        rating: bodyParsed.data.rating,
        comment: bodyParsed.data.comment,
      },
      update: {
        rating: bodyParsed.data.rating,
        comment: bodyParsed.data.comment,
      },
    });

    return NextResponse.json(feedback, { status: 200 });
  } catch (err) {
    // If the call doesn't exist, SQLite FK constraint typically surfaces as P2003
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    throw err;
  }
}
