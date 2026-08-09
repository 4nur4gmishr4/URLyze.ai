import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSafe } from '$lib/server/security/fetchSafe';
import { AppError } from '$lib/types/errors';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup }));

const { fetchMock } = vi.hoisted(() => ({
	fetchMock: vi.fn()
}));

const PUBLIC_IP = '93.184.216.34';

/** Helpers to assert thrown AppError codes without the extra message noise. */
function codeOf(e: unknown): string | null {
	return e instanceof AppError ? e.code : null;
}

beforeEach(() => {
	vi.clearAllMocks();
	// Hostname-aware DNS: internal/metadata/private-looking hosts resolve to a
	// blocked address so redirect-blocking tests don't need their own stub.
	lookup.mockImplementation((host: string) =>
		Promise.resolve([
			{
				address:
					host.includes('internal') || host.includes('metadata') || host.startsWith('10.')
						? '10.0.0.5'
						: PUBLIC_IP,
				family: 4 as const
			}
		])
	);
	fetchMock.mockReset();
	// Stub per-test so afterEach's unstub cannot starve later tests.
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('security/fetchSafe', () => {
	it('fetches a page whose host resolves to a public IP', async () => {
		fetchMock.mockResolvedValue(
			new Response('<html>ok</html>', { status: 200, headers: { 'content-type': 'text/html' } })
		);
		const res = await fetchSafe('https://example.com/page');
		expect(res.ok).toBe(true);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('<html>ok</html>');
		// Requests are sent with redirect: manual (no auto-follow).
		expect(fetchMock.mock.calls[0][1].redirect).toBe('manual');
	});

	it('blocks a URL whose host resolves to a private address', async () => {
		lookup.mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);
		const err = await fetchSafe('https://internal.example.com').then(
			() => null,
			(e) => e
		);
		expect(codeOf(err)).toBe('BLOCKED_URL');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('blocks the cloud metadata endpoint by address', async () => {
		lookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
		const err = await fetchSafe('https://metadata.example.com/').then(() => null, (e) => e);
		expect(codeOf(err)).toBe('BLOCKED_URL');
	});

	it('re-validates each redirect hop and follows safe ones', async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response('', { status: 302, headers: { location: 'https://example.com/final' } })
			)
			.mockResolvedValueOnce(
				new Response('final body', { status: 200, headers: { 'content-type': 'text/html' } })
			);
		const res = await fetchSafe('https://example.com/start');
		expect(await res.text()).toBe('final body');
		expect(fetchMock).toHaveBeenCalledTimes(2);
		// Both hops resolved+validated, so lookup ran twice.
		expect(lookup).toHaveBeenCalledTimes(2);
	});

	it('blocks a redirect that points at a private address', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response('', { status: 302, headers: { location: 'http://10.1.2.3/private' } })
		);
		const err = await fetchSafe('https://example.com/start').then(() => null, (e) => e);
		expect(codeOf(err)).toBe('BLOCKED_URL');
	});

	it('blocks a redirect to a non-http scheme', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response('', { status: 302, headers: { location: 'file:///etc/passwd' } })
		);
		const err = await fetchSafe('https://example.com/start').then(() => null, (e) => e);
		expect(codeOf(err)).toBe('BLOCKED_URL');
	});

	it('stops after too many redirects', async () => {
		fetchMock.mockImplementation(() =>
			Promise.resolve(
				new Response('', { status: 302, headers: { location: 'https://example.com/again' } })
			)
		);
		const err = await fetchSafe('https://example.com/start').then(() => null, (e) => e);
		expect(codeOf(err)).toBe('BLOCKED_URL');
		expect(fetchMock.mock.calls.length).toBe(4); // initial + 3 redirects allowed
	});

	it('caps the body size when reading', async () => {
		fetchMock.mockResolvedValue(
			new Response('x'.repeat(3000), { status: 200, headers: { 'content-type': 'text/html' } })
		);
		const res = await fetchSafe('https://example.com/big', { maxBytes: 1000 });
		const err = await res.text().then(() => null, (e) => e);
		expect(codeOf(err)).toBe('CONTENT_TOO_LARGE');
	});

	it('rejects malformed URLs before any request', async () => {
		const err = await fetchSafe('not-a-url').then(() => null, (e) => e);
		expect(codeOf(err)).toBe('INVALID_URL');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects non-http schemes', async () => {
		const err = await fetchSafe('ftp://example.com/x').then(() => null, (e) => e);
		expect(codeOf(err)).toBe('UNSUPPORTED_URL');
	});
});
