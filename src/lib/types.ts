import { z } from 'zod';

export const ParameterSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().min(1, 'Name is required.'),
  unit: z.string().optional(),
  description: z.string().optional(),
  displayType: z.enum(['radial-gauge', 'line', 'stat', 'bar', 'progress', 'linear-gauge', 'status-light']).default('stat'),
  icon: z.string().optional(),
});

export type Parameter = z.infer<typeof ParameterSchema>;

export const ConfigSchema = z.object({
  name: z.string().min(1, 'Configuration name is required.'),
  parameters: z.array(ParameterSchema),
});

export type Config = z.infer<typeof ConfigSchema>;

export const UserSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  dashboardName: z.string().min(1, 'A dashboard must be assigned.'),
  role: z.enum(['admin', 'user']).default('user'),
});

export type User = z.infer<typeof UserSchema>;
