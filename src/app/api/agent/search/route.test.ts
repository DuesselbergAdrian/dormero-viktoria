import { describe, expect, it, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { POST } from './route';

describe('POST /api/agent/search', () => {
  beforeEach(async () => {
    // Keep tests deterministic: wipe call-related tables
    await db.feedback.deleteMany();
    await db.callMessage.deleteMany();
    await db.toolInvocation.deleteMany();
    await db.call.deleteMany();
  });

  it('returns snippets/confidence and logs Call + ToolInvocation', async () => {
    const req = new Request('http://localhost/api/agent/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'parking coburg' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.callId).toBeTruthy();
    expect(typeof json.answerDraft).toBe('string');
    expect(Array.isArray(json.snippets)).toBe(true);
    expect(typeof json.confidence).toBe('number');

    const call = await db.call.findUnique({
      where: { id: json.callId },
    });
    expect(call).toBeTruthy();
    expect(call?.hotelSlug).toBeTruthy();

    const invocations = await db.toolInvocation.findMany({
      where: { callId: json.callId },
      orderBy: { ts: 'desc' },
      take: 1,
    });
    expect(invocations.length).toBe(1);
    expect(invocations[0].query).toBe('parking coburg');
    expect(typeof invocations[0].resultsJson).toBe('string');
    expect(invocations[0].confidence).toBe(json.confidence);
  });

  it('creates only ToolInvocation when callId is provided (Call already exists)', async () => {
    const call = await db.call.create({
      data: { startedAt: new Date(), status: 'open', hotelSlug: 'dormero-coburg' },
      select: { id: true },
    });

    const req = new Request('http://localhost/api/agent/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'parking coburg', callId: call.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.callId).toBe(call.id);

    const calls = await db.call.findMany();
    expect(calls.length).toBe(1);

    const invocations = await db.toolInvocation.findMany({
      where: { callId: call.id },
    });
    expect(invocations.length).toBe(1);
  });
});
