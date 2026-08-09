import { z } from 'zod';

/**
 * Pure, dependency-free env schema + parser so it can be unit-tested
 * without SvelteKit's `$env` module. Runtime wiring lives in env.ts.
 */

export const envSchema = z
	.object({
		DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
		GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
		GEMINI_MODELS: z
			.string()
			.default('gemini-2.5-flash,gemini-2.0-flash')
			.transform((s) => s.split(',').map((m) => m.trim()).filter(Boolean))
			.pipe(z.array(z.string().min(1)).min(1)),
		RATE_LIMITER: z.enum(['upstash', 'memory']).default('upstash'),
		RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1000).default(20),
		RATE_LIMIT_WINDOW_S: z.coerce.number().int().positive().max(86400).default(3600),
		UPSTASH_REDIS_REST_URL: z.string().url().optional(),
		UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
		SESSION_SECRET: z
			.string()
			.min(32, 'SESSION_SECRET must be at least 32 characters')
			.optional()
	})
	.superRefine((val, ctx) => {
		if (val.RATE_LIMITER === 'upstash') {
			if (!val.UPSTASH_REDIS_REST_URL) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['UPSTASH_REDIS_REST_URL'],
					message: 'UPSTASH_REDIS_REST_URL is required when RATE_LIMITER=upstash'
				});
			}
			if (!val.UPSTASH_REDIS_REST_TOKEN) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['UPSTASH_REDIS_REST_TOKEN'],
					message: 'UPSTASH_REDIS_REST_TOKEN is required when RATE_LIMITER=upstash'
				});
			}
		}
	});

export type AppEnv = z.infer<typeof envSchema>;

/** Parse an env-shaped object, throwing a detailed error on failure. */
export function parseEnv(source: Record<string, string | undefined>): AppEnv {
	return envSchema.parse(source);
}
