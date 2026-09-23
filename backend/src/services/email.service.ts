import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const appUrl = process.env.APP_URL ?? 'http://localhost:4200';

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: 'Project Horizon <accounts@projecthorizon.app>',
    to: email,
    subject: 'Verify your Project Horizon email',
    html: `
      <h1>Verify your email</h1>
      <p>Thanks for signing up for Project Horizon.</p>
      <p>
        <a href="${verificationUrl}">Verify your email</a>
      </p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: 'Project Horizon <accounts@projecthorizon.app>',
    to: email,
    subject: 'Reset your Project Horizon password',
    html: `
      <h1>Reset your password</h1>
      <p>We received a request to reset your Project Horizon password.</p>
      <p>
        <a href="${resetUrl}">Reset your password</a>
      </p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
