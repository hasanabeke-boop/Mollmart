import type { Response } from 'express';
import httpStatus from 'http-status';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import prismaClient from '../config/prisma';
import type {
  EmailRequestBody,
  ResetPasswordRequestBodyType,
  TypedRequest
} from '../types/types';
import { sendResetEmail } from '../utils/sendEmail.util';
import logger from '../middleware/logger';

/**
 * Sends Forgot password email
 * @param req
 * @param res
 * @returns
 */
export const handleForgotPassword = async (
  req: TypedRequest<EmailRequestBody>,
  res: Response
) => {
  const { email } = req.body;

  // check req.body values
  if (!email) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Email is required!'
    });
  }

  // Check if the email exists in the database
  const user = await prismaClient.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: 'Email not found'
    });
  }

  if (!user.emailVerified) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: 'Your email is not verified! Please confirm your email!'
    });
  }

  try {
    // Generate a reset token and save it to the database
    const resetToken = randomUUID();
    const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

    await prismaClient.resetToken.deleteMany({
      where: { userId: user.id }
    });

    await prismaClient.resetToken.create({
      data: {
        token: resetToken,
        expiresAt,
        userId: user.id
      }
    });

    // Send an email with the reset link
    await sendResetEmail(email, resetToken);

    // Return a success message
    return res
      .status(httpStatus.OK)
      .json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to send password reset email'
    });
  }
};

/**
 * Handles Password reset
 * @param req
 * @param res
 * @returns
 */
export const handleResetPassword = async (
  req: TypedRequest<ResetPasswordRequestBodyType>,
  res: Response
) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) return res.sendStatus(httpStatus.NOT_FOUND);

  if (!newPassword) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'New password is required!' });
  }

  // Check if the token exists in the database and is not expired
  const resetToken = await prismaClient.resetToken.findFirst({
    where: { token, expiresAt: { gt: new Date() } }
  });

  if (!resetToken) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ error: 'Invalid or expired token' });
  }

  // Update the user's password in the database
  const hashedPassword = await argon2.hash(newPassword);
  await prismaClient.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword }
  });

  // Delete the reset and all other reset tokens that the user owns from the database
  await prismaClient.resetToken.deleteMany({
    where: { userId: resetToken.userId }
  });

  // Delete also all refresh tokens
  await prismaClient.refreshToken.deleteMany({
    where: {
      userId: resetToken.userId
    }
  });

  // Return a success message
  return res
    .status(httpStatus.OK)
    .json({ message: 'Password reset successful' });
};

export const renderResetPasswordPage = (
  req: TypedRequest,
  res: Response
) => {
  const { token } = req.params;

  if (!token) return res.sendStatus(httpStatus.NOT_FOUND);

  return res.status(httpStatus.OK).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reset Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f5;
            color: #18181b;
            display: grid;
            place-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
          }
          form {
            width: min(100%, 420px);
            background: #ffffff;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          }
          input, button {
            width: 100%;
            padding: 12px;
            margin-top: 12px;
            border-radius: 8px;
            border: 1px solid #d4d4d8;
            box-sizing: border-box;
          }
          button {
            background: #18181b;
            color: #ffffff;
            cursor: pointer;
            border: 0;
          }
        </style>
      </head>
      <body>
        <form method="POST" action="/api/v1/reset-password/${token}">
          <h1>Reset Password</h1>
          <p>Enter a new password to complete your reset request.</p>
          <input
            type="password"
            name="newPassword"
            placeholder="New password"
            minLength="6"
            maxLength="150"
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      </body>
    </html>
  `);
};
