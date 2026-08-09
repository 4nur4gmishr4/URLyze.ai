/**
 * Machine-readable error codes surfaced to the client. They mirror the
 * internal taxonomy (client / source / extraction / AI / database /
 * rate-limit / security) but stay granular enough that the UI can show a
 * specific, actionable message instead of one generic "something went wrong".
 */
export type ErrorCode =
	// request validation (CLIENT_ERROR)
	| 'VALIDATION'
	| 'INVALID_URL'
	| 'UNSUPPORTED_URL'
	// security guard (SECURITY_ERROR)
	| 'BLOCKED_URL'
	// source access (SOURCE_ERROR)
	| 'NETWORK_ERROR'
	| 'TIMEOUT'
	| 'HTTP_ERROR'
	| 'BLOCKED_BY_SOURCE'
	| 'UNSUPPORTED_CONTENT_TYPE'
	// extraction (EXTRACTION_ERROR)
	| 'EMPTY_CONTENT'
	| 'CONTENT_TOO_LARGE'
	| 'EXTRACTION_FAILED'
	// AI (AI_ERROR)
	| 'AI_UNAVAILABLE'
	// database (DATABASE_ERROR)
	| 'DATABASE_ERROR'
	// rate limiting (RATE_LIMIT_ERROR)
	| 'RATE_LIMITED'
	// generic
	| 'NOT_FOUND'
	| 'INTERNAL';

/** Broad category used for logging and monitoring, derived from the code. */
export type ErrorCategory =
	| 'CLIENT_ERROR'
	| 'SECURITY_ERROR'
	| 'SOURCE_ERROR'
	| 'EXTRACTION_ERROR'
	| 'AI_ERROR'
	| 'DATABASE_ERROR'
	| 'RATE_LIMIT_ERROR'
	| 'INTERNAL';

/** Map every granular code to its coarse category. */
export const ERROR_CATEGORY: Record<ErrorCode, ErrorCategory> = {
	VALIDATION: 'CLIENT_ERROR',
	INVALID_URL: 'CLIENT_ERROR',
	UNSUPPORTED_URL: 'CLIENT_ERROR',
	BLOCKED_URL: 'SECURITY_ERROR',
	NETWORK_ERROR: 'SOURCE_ERROR',
	TIMEOUT: 'SOURCE_ERROR',
	HTTP_ERROR: 'SOURCE_ERROR',
	BLOCKED_BY_SOURCE: 'SOURCE_ERROR',
	UNSUPPORTED_CONTENT_TYPE: 'SOURCE_ERROR',
	EMPTY_CONTENT: 'EXTRACTION_ERROR',
	CONTENT_TOO_LARGE: 'EXTRACTION_ERROR',
	EXTRACTION_FAILED: 'EXTRACTION_ERROR',
	AI_UNAVAILABLE: 'AI_ERROR',
	DATABASE_ERROR: 'DATABASE_ERROR',
	RATE_LIMITED: 'RATE_LIMIT_ERROR',
	NOT_FOUND: 'INTERNAL',
	INTERNAL: 'INTERNAL'
};

/** HTTP status for each error code, as delivered to the client. */
export const errorMap: Record<ErrorCode, number> = {
	VALIDATION: 400,
	INVALID_URL: 400,
	UNSUPPORTED_URL: 422,
	BLOCKED_URL: 422,
	NETWORK_ERROR: 502,
	TIMEOUT: 504,
	HTTP_ERROR: 502,
	BLOCKED_BY_SOURCE: 423,
	UNSUPPORTED_CONTENT_TYPE: 415,
	EMPTY_CONTENT: 422,
	CONTENT_TOO_LARGE: 413,
	EXTRACTION_FAILED: 502,
	AI_UNAVAILABLE: 503,
	DATABASE_ERROR: 500,
	RATE_LIMITED: 429,
	NOT_FOUND: 404,
	INTERNAL: 500
};

/** Structured application error with a stable code, HTTP status, and safe message. */
export class AppError extends Error {
	readonly code: ErrorCode;
	readonly status: number;
	/** Optional extra-safe detail; never contains secrets or full URLs. */
	readonly detail?: string;

	constructor(code: ErrorCode, message: string, detail?: string) {
		super(message);
		this.name = 'AppError';
		this.code = code;
		this.status = errorMap[code];
		this.detail = detail;
	}
}
