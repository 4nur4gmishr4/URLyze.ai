import { env } from '../env';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { MemoryRateLimiter, type RateLimitResult } from './memory';
import { AppError } from '$lib/types/errors';
import { log } from '../logging';

export type { RateLimitResult } from './memory';

interface RateLimiter {
	limit(key: string): Promise<RateLimitResult>;
}

/** Sliding-window limiter keyed by client IP. Upstash in prod, memory in dev. */
export const rateLimiter: RateLimiter = buildLimiter();

function buildLimiter(): RateLimiter {
	if (env.RATE_LIMITER === 'upstash') {
		const limiter = new Ratelimit({
			redis: Redis.fromEnv(),
			limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_MAX, `${env.RATE_LIMIT_WINDOW_S} s`),
			analytics: true,
			prefix: 'urlyze'
		});
		log.info('rate-limit: upstash enabled');
		return {
			async limit(key) {
				const { success, remaining, reset } = await limiter.limit(key);
				return { success, remaining, reset };
			}
		};
	}

	const memory = new MemoryRateLimiter(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_S);
	log.warn('rate-limit: in-memory limiter (local dev only)');
	return {
		async limit(key) {
			return memory.limit(key);
		}
	};
}

/** Client IP → limiter key; missing IP falls back to a shared bucket. */
export function ipKey(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0].trim();
		if (first) return first;
	}
	const cf = request.headers.get('cf-connecting-ip');
	if (cf) return cf;
	return 'unknown-ip';
}

/** Enforce the limit, throwing RATE_LIMITED when exhausted. */
export async function enforceRateLimit(request: Request): Promise<void> {
	const result = await rateLimiter.limit(ipKey(request));
	if (!result.success) {
		throw new AppError('RATE_LIMITED', 'Too many requests — please try again later');
	}
}
