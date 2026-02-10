"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiFeedback } from "@/lib/api";
import { upsertFeedback } from "@/lib/api";

function Star({
  filled,
  onClick,
  label,
}: {
  filled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`h-9 w-9 rounded-lg border text-lg leading-none transition
        ${filled ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"}`}
    >
      ★
    </button>
  );
}

export default function FeedbackForm({
  callId,
  initialFeedback,
  onSaved,
}: {
  callId: string;
  initialFeedback: ApiFeedback | null;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState<number>(initialFeedback?.rating ?? 0);
  const [comment, setComment] = useState<string>(initialFeedback?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRating(initialFeedback?.rating ?? 0);
    setComment(initialFeedback?.comment ?? "");
  }, [initialFeedback?.rating, initialFeedback?.comment]);

  const canSave = useMemo(() => rating >= 1 && rating <= 5 && !saving, [rating, saving]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);

    if (rating < 1 || rating > 5) {
      setErr("Please select a rating (1–5).");
      return;
    }

    setSaving(true);
    try {
      await upsertFeedback(callId, {
        rating,
        comment: comment.trim() ? comment.trim() : undefined,
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-sm font-medium text-neutral-900">Rating</div>
        <div className="mt-2 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              filled={n <= rating}
              onClick={() => setRating(n)}
              label={`${n} star${n === 1 ? "" : "s"}`}
            />
          ))}
          <span className="ml-2 text-sm text-neutral-600">{rating ? `${rating}/5` : "Select"}</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-900">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
          placeholder="What was good or missing?"
        />
      </div>

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {err}
        </div>
      ) : null}

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Feedback saved.
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSave}
          className={`rounded-xl px-4 py-2 text-sm font-medium text-white
            ${canSave ? "bg-neutral-900 hover:bg-neutral-800" : "bg-neutral-300"}`}
        >
          {saving ? "Saving..." : "Save feedback"}
        </button>

        <span className="text-xs text-neutral-500">
          {initialFeedback ? "Existing feedback will be updated." : "Stored persistently with this call."}
        </span>
      </div>
    </form>
  );
}
