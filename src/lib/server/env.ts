import { building } from '$app/environment';
import { env as dynamicEnv } from '$env/dynamic/private';
import { parseEnv, type AppEnv } from './env.schema';

/**
 * Validated, server-only environment. Fails fast at first import if a
 * required variable is missing — never trust an unvalidated process.env.
 *
 * During `vite build` there are no runtime env vars yet, but the server
 * bundle is still compiled. `$app/environment`'s `building` flag is a
 * compile-time constant here, so the placeholder branch is dead code at
 * runtime — it exists purely so the build can succeed without credentials.
 * Real values are read from `$env/dynamic/private` on every server start.
 */
const BUILD_PLACEHOLDER: Record<string, string> = {
	DATABASE_URL: 'postgresql://placeholder:placeholder@localhost/urlyze',
	GEMINI_API_KEY: 'placeholder-key',
	GEMINI_MODELS: 'gemini-2.5-flash',
	RATE_LIMITER: 'memory'
};

export const env: AppEnv = building ? parseEnv(BUILD_PLACEHOLDER) : parseEnv(dynamicEnv);
