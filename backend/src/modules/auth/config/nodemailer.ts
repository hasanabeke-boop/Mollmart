import nodemailer, { type Transporter } from 'nodemailer';
import logger from '../../../middleware/logger';
import config from '../../../config/config';

let transporter: Transporter | null = null;
let testAccountPromise: Promise<Transporter> | null = null;

const createTestTransporter = async (): Promise<Transporter> => {
  const account = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });

  logger.info(`Test account created: ${account.user}`);

  return transporter;
};

export const getTransporter = async (): Promise<Transporter | null> => {
  if (!config.email.enabled) {
    logger.warn('Email delivery is disabled because SMTP is using placeholder values.');
    return null;
  }

  if (transporter) return transporter;

  if (config.node_env === 'production') {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: parseInt(config.email.smtp.port),
      secure: false,
      auth: {
        user: config.email.smtp.auth.username,
        pass: config.email.smtp.auth.password
      }
    });

    return transporter;
  }

  if (!testAccountPromise) {
    testAccountPromise = createTestTransporter().catch((error: Error) => {
      testAccountPromise = null;
      throw error;
    });
  }

  return testAccountPromise;
};
