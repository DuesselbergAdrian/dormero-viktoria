import { z } from 'zod';

export const SearchDocumentsInputSchema = z.object({
  query: z.string().min(2, 'Query too short').max(500, 'Query too long'),
  hotelSlug: z.string().min(2).max(100).optional(),
});

export type SearchDocumentsInput = z.infer<typeof SearchDocumentsInputSchema>;

export const AgentSearchInputSchema = z.object({
  query: z.string().min(1, 'query is required').max(1000, 'query too long'),
  callId: z.string().min(1).optional(),
  hotelSlug: z.string().min(1).optional(),
});

export type AgentSearchInput = z.infer<typeof AgentSearchInputSchema>;
