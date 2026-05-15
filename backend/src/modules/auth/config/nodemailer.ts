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

  logger.info(`Ethereal test SMTP ready (user=${account.user}). Mail is not delivered to real inboxes.`);

  return transporter;
};

export const getTransporter = async (): Promise<Transporter | null> => {
  if (transporter) return transporter;

  if (config.email.enabled) {
    const smtpPort = parseInt(config.email.smtp.port, 10);
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: smtpPort,
      secure: smtpPort === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      requireTLS: smtpPort === 587,
      auth: {
        user: config.email.smtp.auth.username,
        pass: config.email.smtp.auth.password
      }
    });
    return transporter;
  }

  if (config.node_env === 'test') {
    return null;
  }

  if (!testAccountPromise) {
    testAccountPromise = createTestTransporter().catch((error: Error) => {
      testAccountPromise = null;
      throw error;
    });
  }
  return testAccountPromise;
};

export default getTransporter;
