import z from 'zod';

import { fileSchema } from '@/common';

export const RegisterSchema = z
  .object({
    username: z.string().min(1).max(100).trim(),
    email: z.email().trim(),
    password: z.string().min(8).max(64),
    confirm_password: z.string().min(8).max(64),
    profile_picture: z.optional(fileSchema({})),
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Password and confirm password do not match',
    path: ['confirm_password'],
  });

export type IRegister = z.infer<typeof RegisterSchema>;
