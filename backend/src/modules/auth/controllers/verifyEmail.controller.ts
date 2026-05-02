import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { randomUUID } from 'crypto';
import prismaClient from '../../../config/prisma';
import type { EmailRequestBody, TypedRequest } from '../types/types';
import { sendVerifyEmail } from '../utils/sendEmail.util';
import logger from '../../../middleware/logger';

/**
 * Sends Verification email
 * @param req
 * @param res
 * @returns
 */
export const sendVerificationEmail = async (
  req: TypedRequest<EmailRequestBody>,
  res: Response
) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Email is required!' });
  }

  // Check if the email exists in the database
  const user = await prismaClient.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true }
  });

  if (!user) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: 'Email not found' });
  }

  // Check if the user's email is already verified
  if (user.emailVerified) {
    return res
      .status(httpStatus.CONFLICT)
      .json({ error: 'Email already verified' });
  }

  // Check if there is an existing verification token that has not expired
  const existingToken = await prismaClient.emailVerificationToken.findFirst({
    where: {
      user: { id: user.id },
      expiresAt: { gt: new Date() }
    }
  });

  if (existingToken) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ error: 'Verification email already sent' });
  }

  try {
    // Generate a new verification token and save it to the database
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour
    await prismaClient.emailVerificationToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id
      }
    });

    // Send an email with the new verification link
    const emailSent = await sendVerifyEmail(email, token);

    // Return a success message
    return res.status(httpStatus.OK).json(
      emailSent
        ? { message: 'Verification email sent' }
        : {
            message: 'Verification email is disabled.',
            verificationToken: token
          }
    );
  } catch (error) {
    logger.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to send verification email'
    });
  }
};

export const handleVerifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) return res.sendStatus(httpStatus.NOT_FOUND);

  // Check if the token exists in the database and is not expired
  const verificationToken = await prismaClient.emailVerificationToken.findUnique({
    where: { token }
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ error: 'Invalid or expired token' });
  }

  // Update the user's email verification status in the database
  await prismaClient.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date() }
  });

  // Delete the verification tokens that the user owns form the database
  await prismaClient.emailVerificationToken.deleteMany({
    where: { userId: verificationToken.userId }
  });

  if (req.method === 'GET' || req.accepts('html')) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Email Verified</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f5; color: #18181b; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 24px;">
          <div style="width: min(100%, 420px); background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); text-align: center;">
            <h1>Email Verified</h1>
            <p>Your email has been verified successfully. You can now sign in.</p>
          </div>
        </body>
      </html>
    `);
  }

  return res.status(200).json({ message: 'Email verification successful' });
};
