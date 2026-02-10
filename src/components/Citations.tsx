"use client";

import type { ApiSnippet } from "@/lib/api";

function hostFromUrl(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function Citations({ snippets }: { snippets: ApiSnippet[] }) {
  if (!snippets.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-600">
        No citations/snippets available for this call.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snippets.map((s, idx) => (
        <div key={`${s.sourceUrl}-${idx}`} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900">{s.title}</div>
              <div className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-700">
                {s.text}
              </div>
              {s.hotelSlug ? (
                <div className="mt-2 text-xs text-neutral-500">Hotel: {s.hotelSlug}</div>
              ) : null}
            </div>

            <div className="shrink-0">
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50"
                title={s.sourceUrl}
              >
                Source: {hostFromUrl(s.sourceUrl)}
              </a>
            </div>
          </div>

          <div className="mt-2 break-all text-xs text-neutral-500">{s.sourceUrl}</div>
        </div>
      ))}
    </div>
  );
}
