import z from 'zod';

import { fileArraySchema, fileSchema, StringToBooleanSchema } from '@/common';

export const CreateMatchingPairSchema = z.object({
  name: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}),
  is_publish_immediately: StringToBooleanSchema.default(false),
  countdown: z.coerce.number().min(10).max(3600),
  score_per_match: z.coerce.number().min(1).max(1000),
  files_to_upload: fileArraySchema({
    max_size: 2 * 1024 * 1024,
    min_amount: 2,
    max_amount: 32,
  }),
});

export type ICreateMatchingPair = z.infer<typeof CreateMatchingPairSchema>;
