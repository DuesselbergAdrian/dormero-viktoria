export type RankableDoc = {
  id: string;
  title: string;
  chunkText: string;
  sourceUrl: string;
  hotelSlug?: string | null;
};

export type RankedDoc = RankableDoc & {
  score: number; // final score after boosts
  overlapCount: number;
  matchedTokens: string[];
};

const STOPWORDS = new Set([
  'der',
  'die',
  'das',
  'und',
  'oder',
  'ein',
  'eine',
  'einer',
  'eines',
  'im',
  'in',
  'am',
  'an',
  'auf',
  'zu',
  'zum',
  'zur',
  'mit',
  'von',
  'für',
  'the',
  'and',
  'or',
  'a',
  'an',
  'to',
  'of',
  'is',
  'are',
]);

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .filter((t) => !STOPWORDS.has(t));
}

export function scoreDocument(params: {
  queryTokens: string[];
  doc: RankableDoc;
  preferredHotelSlug?: string;
}): RankedDoc {
  const { queryTokens, doc, preferredHotelSlug } = params;

  const haystack = `${doc.title} ${doc.chunkText}`.toLowerCase();

  const matchedTokens = queryTokens.filter((t) => haystack.includes(t));
  const overlapCount = matchedTokens.length;

  // Base overlap score: normalized by query token count
  const base = queryTokens.length === 0 ? 0 : overlapCount / queryTokens.length;

  // Small title boost: if token appears in title, it tends to be more “about it”
  const titleLower = doc.title.toLowerCase();
  const titleMatches = queryTokens.filter((t) => titleLower.includes(t)).length;
  const titleBoost = queryTokens.length === 0 ? 0 : (titleMatches / queryTokens.length) * 0.15;

  // Hotel boost: prefer docs for inferred/passed hotel
  const hotelBoost =
    preferredHotelSlug && doc.hotelSlug && doc.hotelSlug === preferredHotelSlug ? 0.25 : 0;

  // Slight length penalty to avoid super long chunks dominating by “accident”
  const length = doc.chunkText.length;
  const lengthPenalty = length > 1200 ? 0.05 : 0;

  const score = Math.max(0, Math.min(1, base + titleBoost + hotelBoost - lengthPenalty));

  return {
    ...doc,
    score,
    overlapCount,
    matchedTokens,
  };
}

export function rankDocuments(params: {
  query: string;
  docs: RankableDoc[];
  preferredHotelSlug?: string;
}): { ranked: RankedDoc[]; confidence: number } {
  const queryTokens = tokenize(params.query);

  const ranked = params.docs
    .map((doc) =>
      scoreDocument({
        queryTokens,
        doc,
        preferredHotelSlug: params.preferredHotelSlug,
      }),
    )
    .sort((a, b) => b.score - a.score);

  // Confidence heuristic:
  // - take best score
  // - lightly incorporate second best to reduce overconfidence on thin matches
  const best = ranked[0]?.score ?? 0;
  const second = ranked[1]?.score ?? 0;
  const confidence = Math.max(0, Math.min(1, best * 0.85 + second * 0.15));

  return { ranked, confidence };
}
