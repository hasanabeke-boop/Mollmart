import logger from '../../../middleware/logger';
import { sendEmail } from '../config/emailSender';
import config from '../../../config/config';

/**
 * This function sends an email to the given email with the reset password link
 *
 * @param {string} email - The email of the user
 * @param {string} token - The reset password token
 */
export const sendResetEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const appUrl = config.corsOrigin.replace(/\/$/, '');
  const resetLink = `${appUrl}/reset-password/${token}`;
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password reset',
    html: `
      <p>Please reset your password by clicking the button below:</p>
      <p>
        <a
          href="${resetLink}"
          style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
        >
          Reset Password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    `
  };

  const info = await sendEmail(mailOptions);
  if (!info) return false;
  logger.info('Reset password email sent: ' + info.response);
  return true;
};

/**
 * This function sends an email to the given email with the email verification link
 *
 * @param {string} email - The email of the user
 * @param {string} token - The email verification token
 */
export const sendVerifyEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const appUrl = config.corsOrigin.replace(/\/$/, '');
  const verifyLink = `${appUrl}/verify-email/${token}`;
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Email verification',
    html: `
      <p>Please verify your email by clicking the button below:</p>
      <p>
        <a
          href="${verifyLink}"
          style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
        >
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
    `
  };

  try {
    const info = await sendEmail(mailOptions);
    if (!info) return false;
    logger.info('Verify email sent: ' + info.response);
    return true;
  } catch (err) {
    logger.error('sendVerifyEmail failed', err);
    return false;
  }
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  bodyPlain: string
): Promise<boolean> => {
  const appUrl = config.corsOrigin.replace(/\/$/, '');
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: `Mollmart: ${subject}`,
    html: `
      <p>${escapeHtml(bodyPlain)}</p>
      <p>
        <a
          href="${escapeHtml(appUrl)}/notifications"
          style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
        >
          View notifications
        </a>
      </p>
      <p style="font-size:12px;color:#666;">If the button does not work, open: ${escapeHtml(appUrl)}/notifications</p>
    `
  };

  const info = await sendEmail(mailOptions);
  if (!info) return false;
  logger.info('Notification email sent: ' + info.response);
  return true;
};
