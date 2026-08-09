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

import type { RequestEvent } from '@sveltejs/kit';

/** Client IP → limiter key; securely provided by SvelteKit adapter. */
export function ipKey(event: RequestEvent): string {
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown-ip';
	}
}

/** Enforce the limit, throwing RATE_LIMITED when exhausted. */
export async function enforceRateLimit(event: RequestEvent): Promise<void> {
	const result = await rateLimiter.limit(ipKey(event));
	if (!result.success) {
		throw new AppError('RATE_LIMITED', 'Too many requests. Please try again later');
	}
}
