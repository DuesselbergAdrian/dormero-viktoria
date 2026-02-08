// src/app/api/calls/api.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { GET as listGET } from "@/app/api/calls/route";
import { GET as detailGET } from "@/app/api/calls/[id]/route";
import { POST as feedbackPOST } from "@/app/api/calls/[id]/feedback/route";

type CallsListItem = {
  id: string;
  startedAt: string;
  hotelSlug: string | null;
  latestTool: { query: string; confidence: number; ts: string } | null;
  feedback: { rating: number; comment: string | null; createdAt: string } | null;
};

type CallDetail = {
  id: string;
  startedAt: string;
  hotelSlug: string | null;
  status: string;
  toolInvocations: Array<{
    id: string;
    query: string;
    confidence: number;
    ts: string;
    answerDraft: string | null;
    snippets: Array<{
      title: string;
      text: string;
      sourceUrl: string;
      hotelSlug?: string | null;
    }>;
  }>;
  feedback: { rating: number; comment: string | null; createdAt: string } | null;
};

async function createCallFixture() {
  const call = await db.call.create({
    data: {
      hotelSlug: "dormero-coburg",
      status: "completed",
    },
  });

  await db.toolInvocation.create({
    data: {
      callId: call.id,
      query: "parking coburg",
      confidence: 0.8,
      resultsJson: JSON.stringify({
        answerDraft: "Parken ist verfügbar. Details findest du in den Richtlinien.",
        confidence: 0.8,
        snippets: [
          {
            title: "Parking Policy",
            text: "Es gibt Parkmöglichkeiten am Hotel (Details siehe Quelle).",
            sourceUrl: "https://example.com/parking",
            hotelSlug: "dormero-coburg",
          },
        ],
      }),
    },
  });

  return call.id;
}

describe("Calls API", () => {
  beforeEach(async () => {
    // Order matters because of FK constraints
    await db.toolInvocation.deleteMany();
    await db.callMessage.deleteMany();
    await db.feedback.deleteMany();
    await db.call.deleteMany();
  });

  it("GET /api/calls returns calls with latest tool + optional feedback", async () => {
    const callId = await createCallFixture();

    const res = await listGET();
    expect(res.status).toBe(200);

    const json = (await res.json()) as CallsListItem[];
    expect(Array.isArray(json)).toBe(true);

    const found = json.find((c) => c.id === callId);
    expect(found).toBeTruthy();
    expect(found?.latestTool).toBeTruthy();
    expect(found?.latestTool?.query).toBe("parking coburg");
    expect(found?.feedback).toBeNull();
  });

  it("POST feedback upserts and shows in GET /api/calls/:id", async () => {
    const callId = await createCallFixture();

    const postRes1 = await feedbackPOST(
      new Request("http://localhost/api/calls/x/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 4, comment: "Helpful." }),
      }),
      { params: Promise.resolve({ id: callId }) }
    );

    expect(postRes1.status).toBe(200);
    const created = (await postRes1.json()) as { rating: number };
    expect(created.rating).toBe(4);

    const postRes2 = await feedbackPOST(
      new Request("http://localhost/api/calls/x/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, comment: "Even better." }),
      }),
      { params: Promise.resolve({ id: callId }) }
    );

    expect(postRes2.status).toBe(200);
    const updated = (await postRes2.json()) as { rating: number };
    expect(updated.rating).toBe(5);

    const detailRes = await detailGET(new Request("http://localhost/api/calls/x"), {
      params: Promise.resolve({ id: callId }),
    });

    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as CallDetail;

    expect(detail.feedback).toBeTruthy();
    expect(detail.feedback?.rating).toBe(5);

    expect(detail.toolInvocations.length).toBeGreaterThan(0);
    expect(detail.toolInvocations[0].snippets.length).toBeGreaterThan(0);
    expect(detail.toolInvocations[0].snippets[0].sourceUrl).toBeTruthy();
  });

  it("GET /api/calls/:id returns 404 for missing call", async () => {
    const res = await detailGET(new Request("http://localhost/api/calls/x"), {
      params: Promise.resolve({ id: "does-not-exist" }),
    });
    expect(res.status).toBe(404);
  });
});
