export class AutomationError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = options.name || "AutomationError";
    this.code = code;
    this.retryable = Boolean(options.retryable);
    this.httpStatus = options.httpStatus || 500;
    this.provider = options.provider || null;
    this.details = options.details || {};
  }
}

export function normalizeAutomationError(error) {
  if (error instanceof AutomationError) return error;
  const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
  return new AutomationError("INTERNAL_ERROR", message, { name: "InternalError" });
}

export function publicError(error) {
  const normalized = normalizeAutomationError(error);
  return {
    code: normalized.code,
    message: normalized.message,
    retryable: normalized.retryable,
    provider: normalized.provider,
    httpStatus: normalized.httpStatus,
    details: normalized.details,
  };
}
