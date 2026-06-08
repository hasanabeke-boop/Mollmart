import nodemailer, { type Transporter } from 'nodemailer';
import logger from '../middleware/logger';
import config from './config';

const smtpPort = parseInt(config.email.smtp.port, 10);

const transporter: Transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: config.email.smtp.auth.username,
    pass: config.email.smtp.auth.password
  }
});

logger.info(
  `SMTP mail transport configured for ${config.email.smtp.host}:${smtpPort}`
);

export default transporter;
