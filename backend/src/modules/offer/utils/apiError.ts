import httpStatus from 'http-status';

export default class ApiError extends Error {
  public readonly statusCode: number;

  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFound = (message: string): ApiError =>
  new ApiError(httpStatus.NOT_FOUND, message);

export const forbidden = (message: string): ApiError =>
  new ApiError(httpStatus.FORBIDDEN, message);

export const badRequest = (message: string, details?: unknown): ApiError =>
  new ApiError(httpStatus.BAD_REQUEST, message, details);

export const conflict = (message: string, details?: unknown): ApiError =>
  new ApiError(httpStatus.CONFLICT, message, details);

export const serviceUnavailable = (message: string, details?: unknown): ApiError =>
  new ApiError(httpStatus.SERVICE_UNAVAILABLE, message, details);
