import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '$lib/types/errors';

// The ip module is exercised directly in ip.test.ts; here it is a mock so the
// orchestration layer (parse → resolve → reject) is tested in isolation.
const { resolveAndValidate } = vi.hoisted(() => ({
	resolveAndValidate: vi.fn<(_: string) => Promise<void>>()
}));
vi.mock('$lib/server/security/ip', () => ({ resolveAndValidate }));

import {
	parseTargetUrl,
	assertSafeHostname,
	validateTarget
} from '$lib/server/security/ssrf';

describe('security/ssrf', () => {
	beforeEach(() => {
		resolveAndValidate.mockReset();
	});

	describe('parseTargetUrl', () => {
		it('accepts http and https URLs', () => {
			expect(parseTargetUrl('http://example.com').protocol).toBe('http:');
			expect(parseTargetUrl('https://example.com/path?q=1').protocol).toBe('https:');
		});

		it('throws INVALID_URL for unparseable input', () => {
			try {
				parseTargetUrl('not a url');
				expect.unreachable();
			} catch (err) {
				expect((err as AppError).code).toBe('INVALID_URL');
			}
		});

		it('throws UNSUPPORTED_URL for non-http(s) schemes', () => {
			for (const raw of ['ftp://example.com', 'file:///etc/passwd', 'javascript:alert(1)']) {
				try {
					parseTargetUrl(raw);
					expect.unreachable();
				} catch (err) {
					expect((err as AppError).code).toBe('UNSUPPORTED_URL');
				}
			}
		});

		it('throws INVALID_URL when there is no host at all', () => {
			// `https://` has no host — the URL parser rejects it, which the
			// guard converts to INVALID_URL rather than a 500.
			try {
				parseTargetUrl('https://');
				expect.unreachable();
			} catch (err) {
				expect((err as AppError).code).toBe('INVALID_URL');
			}
		});
	});

	describe('assertSafeHostname', () => {
		it('passes when every resolved address is global unicast', async () => {
			resolveAndValidate.mockResolvedValueOnce(undefined);
			await expect(assertSafeHostname('example.com')).resolves.toBeUndefined();
		});

		it('throws BLOCKED_URL when resolution fails (private address)', async () => {
			resolveAndValidate.mockRejectedValueOnce(new Error('Blocked non-unicast address'));
			try {
				await assertSafeHostname('internal.example');
				expect.unreachable();
			} catch (err) {
				expect((err as AppError).code).toBe('BLOCKED_URL');
				expect((err as AppError).message).toMatch(/private or unreachable/i);
			}
		});

		it('rejects a hostname that resolves to cloud metadata', async () => {
			resolveAndValidate.mockRejectedValueOnce(new Error('Blocked non-unicast address'));
			await expect(assertSafeHostname('169.254.169.254')).rejects.toBeInstanceOf(AppError);
		});
	});

	describe('validateTarget', () => {
		it('returns the parsed URL when the host is safe', async () => {
			resolveAndValidate.mockResolvedValueOnce(undefined);
			const url = await validateTarget('https://example.com/article');
			expect(url.hostname).toBe('example.com');
			expect(resolveAndValidate).toHaveBeenCalledWith('example.com');
		});

		it('surfaces BLOCKED_URL and never returns for blocked hosts', async () => {
			resolveAndValidate.mockRejectedValueOnce(new Error('Blocked'));
			await expect(validateTarget('http://192.168.1.5')).rejects.toMatchObject({
				code: 'BLOCKED_URL'
			});
		});
	});
});
