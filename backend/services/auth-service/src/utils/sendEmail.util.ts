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
      <form action="${resetLink}" method="POST">
        <button type="submit">Reset Password</button>
      </form>
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
