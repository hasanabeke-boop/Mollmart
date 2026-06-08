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
