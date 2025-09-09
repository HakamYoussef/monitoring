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

// This is the shape of the user data we'll store in the session
export const UserDataSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

export type UserData = z.infer<typeof UserDataSchema>;
