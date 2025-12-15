import { z } from 'zod';

export const CreateGameScoreSchema = z.object({
  game_id: z.string().uuid('Invalid game ID'),
  score: z.coerce.number().int().min(0, 'Score must be non-negative'),
  max_combo: z.coerce.number().int().min(0).optional(),
  time_taken: z.coerce.number().int().min(0, 'Time taken must be non-negative'),
  matched_pairs: z.coerce.number().int().min(0),
  total_pairs: z.coerce.number().int().min(1),
});

export type ICreateGameScore = z.infer<typeof CreateGameScoreSchema>;

export const GameScorePaginateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
});

export type IGameScorePaginateQuery = z.infer<
  typeof GameScorePaginateQuerySchema
>;
