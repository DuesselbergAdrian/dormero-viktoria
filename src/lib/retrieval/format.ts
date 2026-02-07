import type { Snippet } from "./search";

export const FALLBACK_TEXT =
  "Dazu habe ich gerade keine verlässlichen Infos. Soll ich dich mit dem Team verbinden?";

export type FormattedRetrieval = {
  answerDraft: string;
  snippets: Snippet[];
  confidence: number;
};

function clip(text: string, max = 240): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export function formatRetrieval(params: {
  snippets: Snippet[];
  confidence: number;
  minConfidence?: number;
}): FormattedRetrieval {
  const { snippets, confidence, minConfidence = 0.35 } = params;

  if (confidence < minConfidence || snippets.length === 0) {
    return {
      answerDraft: FALLBACK_TEXT,
      snippets: [],
      confidence,
    };
  }

  // 2–3 sentences, grounded:
  // Sentence 1: direct response cue
  // Sentence 2: include key snippet preview
  // Sentence 3 (optional): reference that sources exist (citations happen in UI)
  const top = snippets[0];
  const second = snippets[1];

  const s1 = `Hier ist, was ich dazu in unseren Unterlagen gefunden habe.`;
  const s2 = top
    ? `Relevant ist vor allem: “${clip(top.text, 180)}”`
    : `Ich habe passende Informationen gefunden.`;
  const s3 = second ? `Zusätzlich gibt es Hinweise in “${second.title}”.` : "";

  const draft = [s1, s2, s3].filter(Boolean).join(" ");

  return {
    answerDraft: draft,
    snippets: snippets.slice(0, 5),
    confidence,
  };
}
