import z from 'zod';

import { fileSchema } from '@/common';

export const UpdateMeSchema = z
  .object({
    username: z.string().min(1).max(100).trim(),
    profile_picture: fileSchema({}),
  })
  .partial();

export type IUpdateMe = z.infer<typeof UpdateMeSchema>;
