import { ZodError } from "zod";

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, options: { code: string; statusCode: number; details?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed.", details?: unknown) {
    super(message, { code: "validation_error", statusCode: 400, details });
  }
}

export class LcuConnectionError extends AppError {
  constructor(
    code: "client_not_running" | "auth_failed" | "lcu_unreachable" | "endpoint_unavailable" | "unexpected_payload",
    message: string,
    details?: unknown,
  ) {
    super(message, { code, statusCode: 503, details });
  }
}

export class SyncConflictError extends AppError {
  constructor(message = "A sync is already running.", details?: unknown) {
    super(message, { code: "sync_conflict", statusCode: 409, details });
  }
}

export class ExternalDataError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "external_data_error", statusCode: 502, details });
  }
}

export function normalizeError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ValidationError("Validation failed.", error.flatten());
  }

  if (error instanceof Error) {
    return new AppError(error.message, { code: "internal_error", statusCode: 500 });
  }

  return new AppError("Unknown server error.", { code: "internal_error", statusCode: 500 });
}

export function toErrorResponse(error: unknown) {
  const normalized = normalizeError(error);
  return {
    statusCode: normalized.statusCode,
    body: {
      ok: false,
      error: normalized.message,
      code: normalized.code,
      details: normalized.statusCode < 500 ? normalized.details : undefined,
    },
    error: normalized,
  };
}
