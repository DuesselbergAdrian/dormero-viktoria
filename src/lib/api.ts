// src/lib/api.ts
export type ApiFeedback = {
  rating: number; // 1–5
  comment?: string | null;
  createdAt?: string;
};

export type ApiLatestToolInvocation = {
  query: string;
  confidence: number;
  ts: string;
};

export type ApiCallListItem = {
  id: string;
  startedAt: string;
  hotelSlug: string | null;
  status: string | null;
  latestToolInvocation: ApiLatestToolInvocation | null;
  feedback: ApiFeedback | null;
};

export async function fetchCalls(opts?: {
  hotelSlug?: string;
  hasFeedback?: boolean;
  signal?: AbortSignal;
}): Promise<ApiCallListItem[]> {
  const params = new URLSearchParams();
  if (opts?.hotelSlug) params.set("hotelSlug", opts.hotelSlug);
  if (typeof opts?.hasFeedback === "boolean")
    params.set("hasFeedback", String(opts.hasFeedback));

  const res = await fetch(`/api/calls?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: opts?.signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch calls: ${res.status} ${text}`);
  }

  return (await res.json()) as ApiCallListItem[];
}

export type ApiSnippet = {
  title: string;
  text: string;
  sourceUrl: string;
  hotelSlug?: string | null;
};

export type ApiToolInvocation = {
  id: string;
  query: string;
  confidence: number;
  ts: string;
  snippets?: ApiSnippet[];
};

export type ApiCallMessage = {
  id: string;
  role: string;
  text: string;
  ts: string;
};

export type ApiCallDetail = {
  id: string;
  startedAt: string;
  hotelSlug: string | null;
  status: string | null;
  messages: ApiCallMessage[];
  toolInvocations: ApiToolInvocation[];
  feedback: ApiFeedback | null;
};


export async function fetchCallDetail(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<ApiCallDetail> {
  const res = await fetch(`/api/calls/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: opts?.signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch call detail: ${res.status} ${text}`);
  }

  return (await res.json()) as ApiCallDetail;
}

export async function upsertFeedback(
  id: string,
  payload: { rating: number; comment?: string }
): Promise<ApiFeedback> {
  const res = await fetch(`/api/calls/${id}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to save feedback: ${res.status} ${text}`);
  }

  return (await res.json()) as ApiFeedback;
}
