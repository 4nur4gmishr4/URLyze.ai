import { describe, it, expect } from 'vitest';
import { parseEnv, envSchema } from '$lib/server/env.schema';

const BASE = {
	DATABASE_URL: 'postgresql://u:p@host/db',
	GEMINI_API_KEY: 'key',
	RATE_LIMITER: 'memory'
};

describe('env', () => {
	it('parses a minimal memory-limited config with defaults', () => {
		const env = parseEnv(BASE);
		expect(env.DATABASE_URL).toBe(BASE.DATABASE_URL);
		expect(env.RATE_LIMITER).toBe('memory');
		// GEMINI_MODELS default splits into a non-empty array.
		expect(env.GEMINI_MODELS.length).toBeGreaterThan(0);
		expect(env.GEMINI_MODELS[0]).toBe('gemini-2.5-flash');
		expect(env.RATE_LIMIT_MAX).toBe(20);
		expect(env.RATE_LIMIT_WINDOW_S).toBe(3600);
	});

	it('fails fast when a required variable is missing', () => {
		const { DATABASE_URL: _omit, ...rest } = BASE;
		expect(() => parseEnv(rest)).toThrowError(/DATABASE_URL/);
	});

	it('fails when RATE_LIMITER=upstash without Redis credentials', () => {
		expect(() => parseEnv({ ...BASE, RATE_LIMITER: 'upstash' })).toThrowError(
			/UPSTASH_REDIS_REST_URL/
		);
	});

	it('accepts RATE_LIMITER=upstash with Redis credentials', () => {
		const env = parseEnv({
			...BASE,
			RATE_LIMITER: 'upstash',
			UPSTASH_REDIS_REST_URL: 'https://upstash.example.com',
			UPSTASH_REDIS_REST_TOKEN: 'token'
		});
		expect(env.RATE_LIMITER).toBe('upstash');
	});

	it('splits and trims the model list', () => {
		const env = parseEnv({ ...BASE, GEMINI_MODELS: ' a , b , , c ' });
		expect(env.GEMINI_MODELS).toEqual(['a', 'b', 'c']);
	});

	it('requires SESSION_SECRET to be at least 32 characters', () => {
		expect(() => parseEnv({ ...BASE, SESSION_SECRET: 'short' })).toThrowError(/32/);
		expect(
			parseEnv({ ...BASE, SESSION_SECRET: 'a'.repeat(32) }).SESSION_SECRET?.length
		).toBe(32);
	});

	it('rejects a non-boolean-ish RATE_LIMITER value', () => {
		const result = envSchema.safeParse({ ...BASE, RATE_LIMITER: 'redis' });
		expect(result.success).toBe(false);
	});
});
