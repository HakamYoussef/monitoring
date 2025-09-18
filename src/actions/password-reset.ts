'use server';

import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { Collection } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { PasswordResetToken, User, UserSchema } from '@/lib/types';
import { hashPassword } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email';

const RequestPasswordResetSchema = z.object({
  email: z.string().email('A valid email is required.'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  password: UserSchema.shape.password,
});

async function getTokenCollection(): Promise<Collection<PasswordResetToken> | null> {
  return getCollection<PasswordResetToken>('password_reset_tokens');
}

function buildResetUrl(token: string) {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}/login/reset/${token}`;
}

export async function requestPasswordReset(values: z.infer<typeof RequestPasswordResetSchema>) {
  const validation = RequestPasswordResetSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  if (!isMongoConfigured()) {
    return { success: false, error: 'Password resets are unavailable because the database is not configured.' };
  }

  const usersCollection = await getCollection<User>('users');
  const tokensCollection = await getTokenCollection();

  if (!usersCollection || !tokensCollection) {
    return { success: false, error: 'Unable to connect to the database. Please try again later.' };
  }

  const email = validation.data.email.toLowerCase();
  const user = await usersCollection.findOne({ email });

  if (!user) {
    // Return a generic success message to avoid account enumeration.
    return {
      success: true,
      message: 'If an account exists for that email address, a reset link will arrive shortly.',
    };
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await tokensCollection.updateOne(
    { username: user.username },
    {
      $set: {
        username: user.username,
        tokenHash,
        expiresAt,
      },
    },
    { upsert: true },
  );

  const resetUrl = buildResetUrl(token);

  try {
    await sendPasswordResetEmail({
      email: user.email,
      username: user.username,
      resetUrl,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: 'Failed to send the password reset email. Please try again later.' };
  }

  return {
    success: true,
    message: 'If an account exists for that email address, a reset link will arrive shortly.',
  };
}

export async function resetPassword(values: z.infer<typeof ResetPasswordSchema>) {
  const validation = ResetPasswordSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid reset request.' };
  }

  if (!isMongoConfigured()) {
    return { success: false, error: 'Password resets are unavailable because the database is not configured.' };
  }

  const usersCollection = await getCollection<User>('users');
  const tokensCollection = await getTokenCollection();

  if (!usersCollection || !tokensCollection) {
    return { success: false, error: 'Unable to connect to the database. Please try again later.' };
  }

  const tokenHash = createHash('sha256').update(validation.data.token).digest('hex');
  const tokenRecord = await tokensCollection.findOne({ tokenHash });

  if (!tokenRecord) {
    return { success: false, error: 'This reset link is invalid or has already been used.' };
  }

  const expiresAt = tokenRecord.expiresAt instanceof Date
    ? tokenRecord.expiresAt
    : new Date(tokenRecord.expiresAt);

  if (expiresAt.getTime() < Date.now()) {
    await tokensCollection.deleteOne({ username: tokenRecord.username });
    return { success: false, error: 'This reset link has expired. Please request a new one.' };
  }

  const hashedPassword = await hashPassword(validation.data.password);

  const updateResult = await usersCollection.updateOne(
    { username: tokenRecord.username },
    { $set: { password: hashedPassword } },
  );

  if (updateResult.matchedCount === 0) {
    await tokensCollection.deleteOne({ username: tokenRecord.username });
    return { success: false, error: 'Unable to update the password for this account.' };
  }

  await tokensCollection.deleteOne({ username: tokenRecord.username });
  revalidatePath('/', 'layout');

  return { success: true };
}
