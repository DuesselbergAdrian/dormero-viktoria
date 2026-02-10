"use client";

import type { ApiCallMessage } from "@/lib/api";

function formatTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function Transcript({ messages }: { messages: ApiCallMessage[] }) {
  if (!messages.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-600">
        No transcript messages recorded for this call.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages
        .slice()
        .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
        .map((m) => (
          <div key={m.id} className="rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-neutral-700">{m.role.toUpperCase()}</div>
              <div className="text-xs text-neutral-500">{formatTime(m.ts)}</div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{m.text}</div>
          </div>
        ))}
    </div>
  );
}

