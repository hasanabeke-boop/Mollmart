import logger from '../middleware/logger';
import transporter from '../config/nodemailer';
import config from '../config/config';

/**
 * This function sends an email to the given email with the reset password link
 *
 * @param {string} email - The email of the user
 * @param {string} token - The reset password token
 */
export const sendResetEmail = (email: string, token: string) => {
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
  console.log(resetLink);
  transporter?.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
    } else {
      logger.info('Reset password email sent: ' + info.response);
    }
  });
};

/**
 * This function sends an email to the given email with the email verification link
 *
 * @param {string} email - The email of the user
 * @param {string} token - The email verification token
 */
export const sendVerifyEmail = (email: string, token: string) => {
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
  console.log(verifyLink);
  transporter?.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
    } else {
      logger.info('Verify email sent: ' + info.response);
    }
  });
};

/**
 * This function sends an email confirmation link for an authenticated password change.
 *
 * @param {string} email - The email of the user
 * @param {string} token - The pending password change token
 */
export const sendPasswordChangeEmail = (email: string, token: string) => {
  const confirmLink = `${config.server.url}/api/v1/confirm-password-change/${token}`;
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Confirm password change',
    html: `
      <p>Please confirm your password change by clicking the button below:</p>
      <p><a href="${confirmLink}">Confirm Password Change</a></p>
      <p>If you did not request this change, you can ignore this email.</p>
    `
  };
  console.log(confirmLink);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
    } else {
      logger.info('Password change confirmation email sent: ' + info.response);
    }
  });
};
