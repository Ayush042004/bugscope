import { z } from 'zod';
import sanitize from 'mongo-sanitize';

// Helper to sanitize & trim strings
const sanString = (val: unknown) => {
  if (typeof val !== 'string') return val;
  return sanitize(val.trim());
};

export const SignUpSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Username may contain letters, numbers, underscore, dash')
    .transform(sanString),
  email: z.string()
    .email('Invalid email address')
    .max(128, 'Email too long')
    .transform(sanString),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/(?=.*[a-z])/, 'Must contain a lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Must contain an uppercase letter')
    .regex(/(?=.*\d)/, 'Must contain a number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Must contain a special character')
});

export const ChecklistCreateSchema = z.object({
  scope: z.string().min(2).max(64).transform(sanString)
});

export const ChecklistUpdateSchema = z.object({
  scope: z.string().min(2).max(64).transform(sanString),
  categoryName: z.string().min(1).max(128).transform(sanString),
  itemText: z.string().min(1).max(512).transform(sanString),
  checked: z.boolean(),
  note: z.string().max(2000).optional().transform(val => sanString(val))
});

export const ScopeParamSchema = z.object({
  scope: z.string().min(2).max(64).transform(sanString)
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ChecklistCreateInput = z.infer<typeof ChecklistCreateSchema>;
export type ChecklistUpdateInput = z.infer<typeof ChecklistUpdateSchema>;
export type ScopeParamInput = z.infer<typeof ScopeParamSchema>;
