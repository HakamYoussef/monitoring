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


// User-related schemas and types

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(), // In a real app, this should be a hash
  accessibleDashboards: z.array(z.string()), // Array of dashboard names
});

export type User = z.infer<typeof UserSchema>;

// This is the shape of the user data we'll store in the session
export const UserDataSchema = UserSchema.omit({ password: true });
export type UserData = z.infer<typeof UserDataSchema>;


export const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    accessibleDashboards: z.array(z.string()).min(1, 'You must select at least one dashboard.'),
});

export type SignupData = z.infer<typeof SignupSchema>;