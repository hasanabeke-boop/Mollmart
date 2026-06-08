import nodemailer, { type SendMailOptions } from 'nodemailer';
import config from '../../../config/config';

type EmailSendResult = {
  response: string;
};

const smtpPort = config.email.smtp.port;
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: config.email.smtp.auth.username,
    pass: config.email.smtp.auth.password
  }
});

export async function sendEmail(options: SendMailOptions): Promise<EmailSendResult | null> {
  if (!config.email.enabled) return null;
  const info = await transporter.sendMail(options);
  return { response: info.response };
}

export default sendEmail;
