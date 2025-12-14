import z from 'zod';

import { fileArraySchema, fileSchema, StringToBooleanSchema } from '@/common';

const MatchingPairItemSchema = z.object({
  id: z.string().optional(),
  left_content: z.string(),
  right_content: z.string(),
});

export const UpdateMatchingPairSchema = z.object({
  name: z.string().max(128).trim().optional(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}).optional(),
  is_publish: StringToBooleanSchema.optional(),
  countdown: z.coerce.number().min(10).max(3600).optional(),
  score_per_match: z.coerce.number().min(1).max(1000).optional(),
  files_to_upload: fileArraySchema({
    max_size: 2 * 1024 * 1024,
    min_amount: 1,
    max_amount: 32,
  }).optional(),
  existing_images: z
    .union([z.string(), z.array(z.string())])
    .transform(v => (Array.isArray(v) ? v : [v]))
    .optional(),
  items: z
    .union([
      z.string(), // JSON string from FormData
      z.array(MatchingPairItemSchema), // Direct array
    ])
    .optional()
    .transform(value => {
      if (!value) return;

      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as z.infer<typeof MatchingPairItemSchema>[];
        } catch {
          return;
        }
      }

      return value;
    }),
});

export type IUpdateMatchingPair = z.infer<typeof UpdateMatchingPairSchema>;
