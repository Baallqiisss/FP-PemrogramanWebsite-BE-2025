import z from 'zod';

import { fileArraySchema, fileSchema, StringToBooleanSchema } from '@/common';

const MatchingPairItemSchema = z.object({
  id: z.string().optional(),
  left_content: z.string(),
  right_content: z.string(),
});

export const CreateMatchingPairSchema = z
  .object({
    name: z.string().max(128).trim(),
    description: z.string().max(256).trim().optional(),
    thumbnail_image: fileSchema({}),
    is_publish_immediately: StringToBooleanSchema.default(false),
    countdown: z.coerce.number().min(10).max(3600).optional(),
    score_per_match: z.coerce.number().min(1).max(1000).optional(),
    files_to_upload: fileArraySchema({
      max_size: 2 * 1024 * 1024,
      min_amount: 2,
      max_amount: 32,
    }).optional(),
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
            return JSON.parse(value) as z.infer<
              typeof MatchingPairItemSchema
            >[];
          } catch {
            return;
          }
        }

        return value;
      }),
  })
  .refine(data => data.files_to_upload || data.items, {
    message: 'Either files_to_upload or items must be provided',
  })
  .refine(
    data => {
      if (data.items) {
        return Array.isArray(data.items) && data.items.length >= 2;
      }

      return true;
    },
    {
      message: 'Items must have at least 2 pairs',
    },
  );

export type ICreateMatchingPair = z.infer<typeof CreateMatchingPairSchema>;
