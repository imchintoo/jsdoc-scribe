/**
 * @module errors
 * @description Enterprise error hierarchy for structured, serializable application errors.
 * Every error carries an HTTP status code, a machine-readable code string, and optional metadata.
 * @since 1.6.0
 */

// ─── Base ────────────────────────────────────────────────────────────────────

/**
 * Serialized representation of an AppError suitable for JSON API responses.
 */
export interface SerializedError {
    /** Machine-readable error code (e.g. "VALIDATION_ERROR"). */
    code: string;
    /** Human-readable message. */
    message: string;
    /** HTTP status code. */
    status: number;
    /** ISO timestamp of when the error was created. */
    timestamp: string;
    /** Optional structured details (field errors, context, etc.). */
    details?: Record<string, unknown>;
}

/**
 * Root application error class. All domain errors extend this.
 * Carries an HTTP `status`, a `code` string, and optional `details` metadata.
 *
 * @example
 * throw new AppError("Something went wrong", "INTERNAL_ERROR", 500);
 * @since 1.6.0
 */
export class AppError extends Error {
    /** Machine-readable error code. */
    readonly code: string;
    /** HTTP status code associated with this error. */
    readonly status: number;
    /** ISO timestamp when this error instance was created. */
    readonly timestamp: string;
    /** Arbitrary structured metadata attached to this error. */
    readonly details?: Record<string, unknown>;

    /**
     * TODO: describe what this does.
     * @param {any} message - - Human-readable description of the error.
     * @param {any} code - - Machine-readable code (SCREAMING_SNAKE_CASE).
     * @param {any} [status] - - HTTP status code (default 500).
     * @param {any} [details] - - Optional structured metadata.
     */
    constructor(message: string, code: string, status = 500, details?: Record<string, unknown>) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.status = status;
        this.timestamp = new Date().toISOString();
        this.details = details;
        // Maintain proper prototype chain in transpiled code
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns true if the given value is an AppError instance.
     * @param err - Value to test.
     * @returns Whether err is an AppError.
     */
    static isAppError(err: unknown): err is AppError {
        return err instanceof AppError;
    }

    /**
     * Serializes this error to a plain object safe for JSON API responses.
     * @returns Serialized error payload.
     */
    toJSON(): SerializedError {
        return {
            code: this.code,
            message: this.message,
            status: this.status,
            timestamp: this.timestamp,
            ...(this.details ? { details: this.details } : {}),
        };
    }

    /**
     * Returns a string representation including status and code.
     * @returns Formatted string.
     */
    override toString(): string {
        return `[${this.status}] ${this.code}: ${this.message}`;
    }
}

// ─── HTTP 4xx ────────────────────────────────────────────────────────────────

/**
 * 400 Bad Request — the request body or parameters failed validation.
 * Attach per-field errors via the `fields` map.
 *
 * @example
 * throw new ValidationError("Invalid input", { email: "Must be a valid email address" });
 * @since 1.6.0
 */
export class ValidationError extends AppError {
    /** Per-field validation messages keyed by field name. */
    readonly fields: Record<string, string>;

    /**
     * TODO: describe what this does.
     * @param {any} message - - Summary message.
     * @param {any} [fields] - - Map of field name → validation message.
     * @throws {TypeError} If fields is not a plain object.
     */
    constructor(message: string, fields: Record<string, string> = {}) {
        super(message, "VALIDATION_ERROR", 400, { fields });
        this.fields = fields;
    }

    /**
     * Returns the validation message for a specific field, or undefined.
     * @param field - Field name to look up.
     * @returns Validation message for that field, if any.
     */
    getFieldError(field: string): string | undefined {
        return this.fields[field];
    }

    /**
     * True if there is at least one field-level error.
     * @returns Whether any field errors are present.
     */
    get hasFieldErrors(): boolean {
        return Object.keys(this.fields).length > 0;
    }
}

/**
 * 401 Unauthorized — the request lacks valid authentication credentials.
 * @since 1.6.0
 */
export class AuthError extends AppError {
    /**
     * TODO: describe what this does.
     * @param {any} [message] - - Human-readable message (default: "Authentication required").
     * @param {any} [code] - - Override error code (default: "AUTH_ERROR").
     */
    constructor(message = "Authentication required", code = "AUTH_ERROR") {
        super(message, code, 401);
    }
}

/**
 * 403 Forbidden — the caller is authenticated but not permitted to perform this action.
 * @since 1.6.0
 */
export class ForbiddenError extends AppError {
    /**
     * TODO: describe what this does.
     * @param {any} [message] - - Human-readable message (default: "Access denied").
     * @param {any} [requiredRole] - - Optional role that would have granted access.
     */
    constructor(message = "Access denied", requiredRole?: string) {
        super(message, "FORBIDDEN", 403, requiredRole ? { requiredRole } : undefined);
    }
}

/**
 * 404 Not Found — the requested resource does not exist.
 * @since 1.6.0
 */
export class NotFoundError extends AppError {
    /**
     * TODO: describe what this does.
     * @param {any} resource - - The resource type that was not found (e.g. "User").
     * @param {any} [id] - - The identifier that was looked up.
     */
    constructor(resource: string, id?: string | number) {
        /**
 * TODO: describe what this does.
         * @constant msg
         * @type {any}
         */
        const msg = id !== undefined ? `${resource} with id "${id}" not found` : `${resource} not found`;
        super(msg, "NOT_FOUND", 404, { resource, id });
    }
}

/**
 * 409 Conflict — the resource already exists or a state conflict was detected.
 * @since 1.6.0
 */
export class ConflictError extends AppError {
    /**
     * TODO: describe what this does.
     * @param {any} message - - Conflict description.
     * @param {any} [conflictingField] - - Optional field that caused the conflict (e.g. "email").
     */
    constructor(message: string, conflictingField?: string) {
        super(message, "CONFLICT", 409, conflictingField ? { conflictingField } : undefined);
    }
}

/**
 * 429 Too Many Requests — the caller has exceeded a rate limit.
 * @since 1.6.0
 */
export class RateLimitError extends AppError {
    /** Epoch timestamp (ms) when the rate limit resets. */
    readonly resetAt: number;

    /**
     * TODO: describe what this does.
     * @param {any} resetAt - - Unix timestamp (ms) when the limit resets.
     * @param {any} [message] - - Human-readable message.
     */
    constructor(resetAt: number, message = "Rate limit exceeded") {
        super(message, "RATE_LIMIT_EXCEEDED", 429, { resetAt });
        this.resetAt = resetAt;
    }

    /** Seconds remaining until the rate limit resets. */
    get retryAfterSeconds(): number {
        return Math.max(0, Math.ceil((this.resetAt - Date.now()) / 1000));
    }
}

// ─── HTTP 5xx ────────────────────────────────────────────────────────────────

/**
 * 503 Service Unavailable — a downstream dependency failed.
 * @since 1.6.0
 */
export class ServiceUnavailableError extends AppError {
    /**
     * TODO: describe what this does.
     * @param {any} service - - Name of the unavailable service (e.g. "database", "redis").
     * @param {any} [cause] - - Optional underlying error.
     */
    constructor(service: string, cause?: Error) {
        super(`Service "${service}" is unavailable`, "SERVICE_UNAVAILABLE", 503, { service, cause: cause?.message });
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps any unknown thrown value in an {@link AppError}.
 * If the value is already an {@link AppError} it is returned as-is.
 *
 * @param err - The caught value.
 * @param fallbackMessage - Message to use if err is not an Error.
 * @returns An AppError instance.
 * @since 1.6.0
 */
export function toAppError(err: unknown, fallbackMessage = "An unexpected error occurred"): AppError {
    if (err instanceof AppError) return err;
    if (err instanceof Error) return new AppError(err.message, "INTERNAL_ERROR", 500);
    return new AppError(fallbackMessage, "INTERNAL_ERROR", 500);
}

/**
 * Type guard — returns true when `status` is in the 4xx range.
 * Useful for distinguishing {@link ValidationError}, {@link AuthError}, and {@link NotFoundError} from server faults.
 * @param err - AppError to check.
 * @returns Whether this is a client error.
 * @since 1.6.0
 */
export function isClientError(err: AppError): boolean {
    return err.status >= 400 && err.status < 500;
}

/**
 * Type guard — returns true when `status` is in the 5xx range.
 * @param err - AppError to check.
 * @returns Whether this is a server error.
 * @since 1.6.0
 */
export function isServerError(err: AppError): boolean {
    return err.status >= 500;
}

/**
 * Formats an AppError as a single human-readable log line.
 * Includes the ISO timestamp, status, code, and message — omits `details`
 * (callers that want structured data should use {@link AppError.toJSON} instead).
 *
 * @param err - AppError to format.
 * @returns A single-line log string.
 * @since 1.6.0
 */
export function formatErrorForLog(err: AppError): string {
    return `${err.timestamp} [${err.status}] ${err.code}: ${err.message}`;
}
