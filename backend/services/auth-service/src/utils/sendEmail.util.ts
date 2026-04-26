import logger from '../middleware/logger';
import { getTransporter } from '../config/nodemailer';
import config from '../config/config';

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
  const resetLink = `${config.server.url}/api/v1/reset-password/${token}`;
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

  const transporter = await getTransporter();
  if (!transporter) return false;
  const info = await transporter.sendMail(mailOptions);
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
  const verifyLink = `${config.server.url}/api/v1/verify-email/${token}`;
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Email verification',
    html: `
      <p>Please verify your email by clicking the button below:</p>
      <p><a href="${verifyLink}">Verify Email</a></p>
    `
  };

  const transporter = await getTransporter();
  if (!transporter) return false;
  const info = await transporter.sendMail(mailOptions);
  logger.info('Verify email sent: ' + info.response);
  return true;
};
