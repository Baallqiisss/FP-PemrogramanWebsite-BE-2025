import z from 'zod';

export const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(1),
    new_password: z.string().min(8).max(64),
    confirm_password: z.string().min(8).max(64),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: 'New password and confirm password do not match',
    path: ['confirm_password'],
  });

export type IChangePassword = z.infer<typeof ChangePasswordSchema>;

