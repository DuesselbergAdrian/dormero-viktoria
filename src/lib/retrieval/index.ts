import { inferHotelSlugFromQuery } from '@/lib/hotelMatch';
import { SearchDocumentsInputSchema } from '@/lib/validators';
import { searchDocuments } from './search';
import { formatRetrieval } from './format';

export async function retrieveAnswer(input: { query: string; hotelSlug?: string }) {
  const parsed = SearchDocumentsInputSchema.parse(input);

  const inferredHotel = parsed.hotelSlug ?? inferHotelSlugFromQuery(parsed.query);

  const { snippets, confidence } = await searchDocuments({
    query: parsed.query,
    hotelSlug: inferredHotel,
    limit: 5,
  });

  return formatRetrieval({
    snippets,
    confidence,
  });
}
