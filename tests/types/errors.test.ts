import { describe, it, expect } from 'vitest';
import { AppError, errorMap, ERROR_CATEGORY } from '$lib/types/errors';

describe('types/errors', () => {
	it('maps every error code to a status and a category', () => {
		// The two tables must cover the exact same set of codes.
		expect(Object.keys(errorMap).sort()).toEqual(Object.keys(ERROR_CATEGORY).sort());
	});

	it('returns the expected statuses for the headline codes', () => {
		expect(errorMap.VALIDATION).toBe(400);
		expect(errorMap.BLOCKED_URL).toBe(422);
		expect(errorMap.UNSUPPORTED_CONTENT_TYPE).toBe(415);
		expect(errorMap.CONTENT_TOO_LARGE).toBe(413);
		expect(errorMap.RATE_LIMITED).toBe(429);
		expect(errorMap.AI_UNAVAILABLE).toBe(503);
		expect(errorMap.TIMEOUT).toBe(504);
	});

	it('groups client errors, security and rate-limit correctly', () => {
		expect(ERROR_CATEGORY.VALIDATION).toBe('CLIENT_ERROR');
		expect(ERROR_CATEGORY.BLOCKED_URL).toBe('SECURITY_ERROR');
		expect(ERROR_CATEGORY.RATE_LIMITED).toBe('RATE_LIMIT_ERROR');
		expect(ERROR_CATEGORY.INTERNAL).toBe('INTERNAL');
	});

	it('builds an AppError with the right status', () => {
		const err = new AppError('RATE_LIMITED', 'Too many requests');
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe('AppError');
		expect(err.code).toBe('RATE_LIMITED');
		expect(err.status).toBe(429);
		expect(err.detail).toBeUndefined();
	});

	it('carries an optional detail string', () => {
		const err = new AppError('BLOCKED_URL', 'Blocked', 'private address');
		expect(err.detail).toBe('private address');
	});

	it('keeps the message readable and uncluttered', () => {
		expect(new AppError('VALIDATION', 'A URL is required').message).toBe('A URL is required');
	});
});
