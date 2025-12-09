import z from 'zod';

export const CheckMatchingPairSchema = z.object({
  matched_pair_ids: z.array(z.number().min(0)).min(0).max(32),
});

export type ICheckMatchingPair = z.infer<typeof CheckMatchingPairSchema>;
