import { z } from "zod";

export const SearchDocumentsInputSchema = z.object({
  query: z.string().min(2, "Query too short").max(500, "Query too long"),
  hotelSlug: z.string().min(2).max(100).optional(),
});

export type SearchDocumentsInput = z.infer<typeof SearchDocumentsInputSchema>;
