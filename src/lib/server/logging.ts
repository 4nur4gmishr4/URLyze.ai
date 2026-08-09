/**
 * Sanitized logging. Never logs full URLs, query strings, request bodies,
 * or secrets — only hostnames and stable error types.
 */

/** Reduce a URL to its hostname for safe logging. */
export function sanitizeUrl(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '<invalid-url>';
	}
}

type Level = 'info' | 'warn' | 'error';

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
	const line = `[urlyze:${level}] ${message}`;
	if (meta && Object.keys(meta).length > 0) {
		// JSON.stringify of meta is safe: we only ever pass sanitized fields in.
		// eslint-disable-next-line no-console
		console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
			line,
			JSON.stringify(meta)
		);
	} else {
		// eslint-disable-next-line no-console
		console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](line);
	}
}

export const log = {
	info(message: string, meta?: Record<string, unknown>): void {
		write('info', message, meta);
	},
	warn(message: string, meta?: Record<string, unknown>): void {
		write('warn', message, meta);
	},
	error(message: string, meta?: Record<string, unknown>): void {
		write('error', message, meta);
	}
};
