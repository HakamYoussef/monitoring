import { z } from 'zod';

export const ParameterSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().min(1, 'Name is required.'),
  unit: z.string().optional(),
  description: z.string().optional(),
  displayType: z.enum(['gauge', 'line', 'stat', 'bar', 'progress']).default('stat'),
});

export type Parameter = z.infer<typeof ParameterSchema>;

export const ConfigSchema = z.object({
  parameters: z.array(ParameterSchema),
});

export type Config = z.infer<typeof ConfigSchema>;
