import { z } from 'zod';

export const ParameterSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().min(1, 'Name is required.'),
  unit: z.string().optional(),
  description: z.string().optional(),
  displayType: z.enum(['radial-gauge', 'line', 'stat', 'bar', 'progress', 'linear-gauge', 'status-light']).default('stat'),
});

export type Parameter = z.infer<typeof ParameterSchema>;

export const ConfigSchema = z.object({
  name: z.string().min(1, 'Configuration name is required.'),
  parameters: z.array(ParameterSchema),
});

export type Config = z.infer<typeof ConfigSchema>;

// Auth types
export const UserSessionSchema = z.object({
  username: z.string(),
  role: z.enum(['admin', 'user']),
  project: z.string().optional(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;
