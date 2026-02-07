export function inferHotelSlugFromQuery(query: string): string | undefined {
  const q = query.toLowerCase();

  // Simple POC rules; extend later (city names, aliases, etc.)
  if (q.includes('coburg')) return 'dormero-coburg';

  // Could add: if q.includes("dormero") && q.includes("coburg") ...
  return undefined;
}
