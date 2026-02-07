import { db } from "@/lib/db";
import { rankDocuments, type RankableDoc } from "./rank";

export type Snippet = {
  title: string;
  text: string;
  sourceUrl: string;
  hotelSlug?: string;
};

export async function searchDocuments(params: {
  query: string;
  hotelSlug?: string;
  limit?: number; // default 5
}): Promise<{ snippets: Snippet[]; confidence: number }> {
  const { query, hotelSlug, limit = 5 } = params;

  // Fetch candidate docs:
  // For a POC, pull all docs (small dataset). For scale, add keyword filtering at DB level.
  const docs = await db.document.findMany({
    include: { hotel: true },
  });

  const rankables: RankableDoc[] = docs.map((d) => ({
    id: d.id,
    title: d.title,
    chunkText: d.chunkText,
    sourceUrl: d.sourceUrl,
    hotelSlug: d.hotel?.slug ?? null,
  }));

  const { ranked, confidence } = rankDocuments({
    query,
    docs: rankables,
    preferredHotelSlug: hotelSlug,
  });

  const top = ranked
    .filter((r) => r.score > 0) // remove total misses
    .slice(0, limit)
    .map((r) => ({
      title: r.title,
      text: r.chunkText,
      sourceUrl: r.sourceUrl,
      hotelSlug: r.hotelSlug ?? undefined,
    }));

  return { snippets: top, confidence };
}
