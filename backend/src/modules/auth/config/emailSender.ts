import nodemailer, { type SendMailOptions } from 'nodemailer';
import config from '../../../config/config';

type EmailSendResult = {
  response: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GmailSendResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

const HTTP_TIMEOUT_MS = 10_000;
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

let gmailAccessToken: { value: string; expiresAt: number } | null = null;

function getResponseError(body: GoogleTokenResponse | GmailSendResponse, fallback: string): string {
  if ('error_description' in body && body.error_description) return body.error_description;
  if (typeof body.error === 'string' && body.error) return body.error;
  if (typeof body.error === 'object' && body.error?.message) return body.error.message;
  return fallback;
}

async function getGmailAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && gmailAccessToken != null && gmailAccessToken.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return gmailAccessToken.value;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: config.email.gmailApi.clientId,
      client_secret: config.email.gmailApi.clientSecret,
      refresh_token: config.email.gmailApi.refreshToken,
      grant_type: 'refresh_token'
    }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
  });
  const body = (await response.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!response.ok || !body.access_token) {
    throw new Error(getResponseError(body, `Gmail OAuth token refresh failed (${response.status})`));
  }

  gmailAccessToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000
  };
  return gmailAccessToken.value;
}

async function buildRawMimeMessage(options: SendMailOptions): Promise<string> {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix'
  });
  const info = await transport.sendMail(options);
  if (!Buffer.isBuffer(info.message)) {
    throw new Error('Failed to build MIME email for Gmail API');
  }
  return info.message.toString('base64url');
}

async function postGmailMessage(raw: string, accessToken: string): Promise<Response> {
  const userId = encodeURIComponent(config.email.gmailApi.userId);
  return fetch(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
  });
}

async function sendViaGmailApi(options: SendMailOptions): Promise<EmailSendResult> {
  const raw = await buildRawMimeMessage(options);
  let response = await postGmailMessage(raw, await getGmailAccessToken());
  if (response.status === 401) {
    gmailAccessToken = null;
    response = await postGmailMessage(raw, await getGmailAccessToken(true));
  }

  const body = (await response.json().catch(() => ({}))) as GmailSendResponse;
  if (!response.ok || !body.id) {
    throw new Error(getResponseError(body, `Gmail API send failed (${response.status})`));
  }
  return { response: `Gmail API message id=${body.id}` };
}

export async function sendEmail(options: SendMailOptions): Promise<EmailSendResult | null> {
  if (!config.email.enabled) return null;
  return sendViaGmailApi(options);
}

export default sendEmail;
