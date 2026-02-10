// src/components/CallDetail.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCallDetail, type ApiCallDetail } from "@/lib/api";
import Citations from "@/components/Citations";
import Transcript from "@/components/Transcript";
import FeedbackForm from "@/components/FeedbackForm";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-neutral-100 text-neutral-700 ring-neutral-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}

export default function CallDetail({ callId }: { callId: string }) {
  const [data, setData] = useState<ApiCallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await fetchCallDetail(callId);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    void load();
  }, [load]);

  const latestInvocation = useMemo(() => {
    if (!data?.toolInvocations?.length) return null;
    return [...data.toolInvocations].sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    )[0];
  }, [data]);

  const allSnippets = useMemo(() => {
    const invs = data?.toolInvocations ?? [];
    const snippets = invs.flatMap((ti) => ti.snippets ?? []);
    const seen = new Set<string>();
    return snippets.filter((s) => {
      const key = `${s.title}||${s.sourceUrl}||${s.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded bg-neutral-200" />
          <div className="h-4 w-72 rounded bg-neutral-200" />
          <div className="h-24 w-full rounded bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Could not load call
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{err}</p>
          </div>
          <button
            onClick={() => void load()}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <p className="text-sm text-neutral-600">No data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Overview</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Started:{" "}
              <span className="text-neutral-900">
                {formatDateTime(data.startedAt)}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge>{data.hotelSlug ?? "unknown hotel"}</Badge>
              {latestInvocation ? (
                <>
                  <Badge
                    tone={latestInvocation.confidence >= 0.6 ? "good" : "warn"}
                  >
                    confidence {Math.round(latestInvocation.confidence * 100)}%
                  </Badge>
                  <Badge>{formatDateTime(latestInvocation.ts)}</Badge>
                </>
              ) : (
                <Badge tone="warn">no tool invocation</Badge>
              )}
            </div>
          </div>

          <button
            onClick={() => void load()}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>
      </section>

      {/* Tool invocations */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">
          Tool invocations
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          What the agent searched for, when, and how confident it was.
        </p>

        <div className="mt-4 space-y-3">
          {data.toolInvocations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-600">
              No tool invocations recorded for this call yet.
            </div>
          ) : (
            data.toolInvocations
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.ts).getTime() - new Date(a.ts).getTime()
              )
              .map((ti) => (
                <div
                  key={ti.id}
                  className="rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-900">
                        Query
                      </div>
                      <div className="mt-1 break-words text-sm text-neutral-700">
                        {ti.query}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={ti.confidence >= 0.6 ? "good" : "warn"}>
                        {Math.round(ti.confidence * 100)}%
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        {formatDateTime(ti.ts)}
                      </span>
                    </div>
                  </div>

                  {ti.snippets?.length ? (
                    <div className="mt-3 text-xs text-neutral-500">
                      {ti.snippets.length} snippet
                      {ti.snippets.length === 1 ? "" : "s"} returned
                    </div>
                  ) : null}
                </div>
              ))
          )}
        </div>
      </section>

      {/* Citations */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Citations</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Sources used to ground factual answers (title, snippet, and URL).
        </p>

        <div className="mt-4">
          <Citations snippets={allSnippets} />
        </div>
      </section>

      {/* Transcript */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Transcript</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Call messages, if available (rendered gracefully when empty).
        </p>

        <div className="mt-4">
          <Transcript messages={data.messages} />
        </div>
      </section>

      {/* Feedback */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Feedback</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Rate the answer quality to close the loop. Updates persist immediately.
        </p>

        <div className="mt-4">
          <FeedbackForm
            callId={callId}
            initialFeedback={data.feedback}
            onSaved={() => void load()}
          />
        </div>
      </section>
    </div>
  );
}
