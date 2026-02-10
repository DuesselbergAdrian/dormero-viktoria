// src/app/calls/[id]/page.tsx
import Link from "next/link";
import CallDetail from "@/components/CallDetail";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Back to calls
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
            Call Detail <span className="text-neutral-400">#{id.slice(-6)}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Traceability: tool queries, confidence, citations, transcript, and feedback.
          </p>
        </div>

        <CallDetail callId={id} />
      </div>
    </main>
  );
}
