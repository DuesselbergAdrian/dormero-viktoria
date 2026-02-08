// src/components/CallCard.tsx
import Link from "next/link";
import type { ApiCallListItem } from "@/lib/api";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceLabel(c: number) {
  if (c >= 0.8) return "High";
  if (c >= 0.55) return "Medium";
  return "Low";
}

function badgeClasses(kind: "neutral" | "good" | "warn") {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset";
  if (kind === "good") return `${base} bg-green-50 text-green-700 ring-green-200`;
  if (kind === "warn") return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
  return `${base} bg-zinc-50 text-zinc-700 ring-zinc-200`;
}

export function CallCard({ call }: { call: ApiCallListItem }) {
  const query = call.latestToolInvocation?.query ?? "—";
  const confidence = call.latestToolInvocation?.confidence ?? null;

  const confKind =
    confidence == null
      ? "neutral"
      : confidence >= 0.8
        ? "good"
        : confidence >= 0.55
          ? "warn"
          : "neutral";

  const rating = call.feedback?.rating ?? null;

  return (
    <Link
      href={`/calls/${call.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-600">
              {formatDateTime(call.startedAt)}
            </span>

            <span className={badgeClasses("neutral")}>
              {call.hotelSlug ?? "unknown hotel"}
            </span>

            {confidence != null && (
              <span className={badgeClasses(confKind)}>
                {confidenceLabel(confidence)} · {Math.round(confidence * 100)}%
              </span>
            )}

            {rating != null && (
              <span className={badgeClasses("good")}>Rating · {rating}/5</span>
            )}
          </div>

          <div className="mt-2 line-clamp-2 text-base font-semibold text-zinc-900">
            {query}
          </div>

          <div className="mt-1 text-sm text-zinc-600">
            Status: {call.status ?? "—"}
          </div>
        </div>

        <div className="shrink-0 text-sm font-medium text-zinc-700">
          View →
        </div>
      </div>
    </Link>
  );
}
