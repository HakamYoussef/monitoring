import { APP_NAME } from '@/lib/branding';

type PasswordResetEmailParams = {
  email: string;
  username: string;
  resetUrl: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail({ email, username, resetUrl }: PasswordResetEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info('RESEND_API_KEY is not configured. Password reset link:', resetUrl);
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'no-reply@nay-project.local';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: [
        `<p>Hi ${username},</p>`,
        `<p>You recently requested to reset your ${APP_NAME} password.</p>`,
        '<p>Click the button below to set a new password. This link will expire in 1 hour.</p>',
        `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px">Reset password</a></p>`,
        `<p>If the button does not work, copy and paste this URL into your browser:</p>`,
        `<p><a href="${resetUrl}">${resetUrl}</a></p>`,
        '<p>If you did not request a password reset, you can safely ignore this email.</p>',
        `<p>— ${APP_NAME} Team</p>`,
      ].join(''),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send password reset email: ${response.status} ${errorBody}`);
  }
}
