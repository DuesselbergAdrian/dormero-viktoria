// src/app/page.tsx
import { CallList } from "@/components/CallList";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Viktoria Control Center
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Review call logs, trace answers back to sources, and collect feedback.
        </p>
      </div>

      <CallList />
    </main>
  );
}
