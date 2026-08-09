/**
 * In-process sliding-window rate limiter for local development only.
 * One window's worth of timestamps per key, pruned on each hit.
 * Never used in production when Upstash is configured.
 */

export interface RateLimitResult {
	success: boolean;
	remaining: number;
	/** seconds until the current window resets */
	reset: number;
}

export class MemoryRateLimiter {
	private hits = new Map<string, number[]>();

	constructor(
		private max: number,
		private windowSeconds: number
	) {}

	limit(key: string, now = Date.now()): RateLimitResult {
		const windowMs = this.windowSeconds * 1000;
		const timestamps = (this.hits.get(key) ?? []).filter((t) => now - t < windowMs);

		if (timestamps.length >= this.max) {
			this.hits.set(key, timestamps);
			const oldest = timestamps[0];
			return {
				success: false,
				remaining: 0,
				reset: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
			};
		}

		timestamps.push(now);
		this.hits.set(key, timestamps);
		return {
			success: true,
			remaining: this.max - timestamps.length,
			reset: Math.ceil(windowMs / 1000)
		};
	}
}
