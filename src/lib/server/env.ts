import { env as dynamicEnv } from '$env/dynamic/private';
import { parseEnv, type AppEnv } from './env.schema';

/**
 * Validated, server-only environment. Fails fast at first import if a
 * required variable is missing — never trust an unvalidated process.env.
 */
export const env: AppEnv = parseEnv(dynamicEnv as Record<string, string | undefined>);
