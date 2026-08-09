import { describe, it, expect } from 'vitest';
import {
	normalizeIp,
	isGlobalUnicast,
	hasBlockedAddress,
	type ResolvedAddress
} from '$lib/server/security/ip';

describe('security/ip', () => {
	describe('normalizeIp', () => {
		it('unwraps IPv4-mapped IPv6 addresses', () => {
			expect(normalizeIp('::ffff:1.2.3.4')).toBe('1.2.3.4');
			expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
		});

		it('leaves plain IPv4 and IPv6 untouched', () => {
			expect(normalizeIp('93.184.216.34')).toBe('93.184.216.34');
			expect(normalizeIp('2606:4700::6810:84e5')).toBe('2606:4700::6810:84e5');
		});
	});

	describe('isGlobalUnicast', () => {
		it('allows global unicast addresses', () => {
			expect(isGlobalUnicast('93.184.216.34')).toBe(true);
			expect(isGlobalUnicast('1.1.1.1')).toBe(true);
			expect(isGlobalUnicast('2606:4700:4700::1111')).toBe(true);
		});

		it('blocks private ranges', () => {
			expect(isGlobalUnicast('10.0.0.1')).toBe(false);
			expect(isGlobalUnicast('172.16.0.1')).toBe(false);
			expect(isGlobalUnicast('192.168.1.1')).toBe(false);
		});

		it('blocks loopback', () => {
			expect(isGlobalUnicast('127.0.0.1')).toBe(false);
			expect(isGlobalUnicast('::1')).toBe(false);
		});

		it('blocks link-local including the cloud metadata endpoint', () => {
			expect(isGlobalUnicast('169.254.169.254')).toBe(false);
			expect(isGlobalUnicast('fe80::1')).toBe(false);
		});

		it('blocks IPv4-mapped private after normalization', () => {
			expect(isGlobalUnicast('::ffff:127.0.0.1')).toBe(false);
			expect(isGlobalUnicast('::ffff:10.0.0.1')).toBe(false);
		});

		it('blocks unspecified, multicast, and broadcast', () => {
			expect(isGlobalUnicast('0.0.0.0')).toBe(false);
			expect(isGlobalUnicast('224.0.0.1')).toBe(false);
			expect(isGlobalUnicast('255.255.255.255')).toBe(false);
		});
	});

	describe('hasBlockedAddress', () => {
		const addr = (address: string, family: 4 | 6): ResolvedAddress => ({ address, family });

		it('is false when every address is safe', () => {
			expect(hasBlockedAddress([addr('93.184.216.34', 4), addr('2606:4700::1', 6)])).toBe(false);
		});

		it('is true when any address is unsafe', () => {
			expect(
				hasBlockedAddress([addr('93.184.216.34', 4), addr('169.254.169.254', 4)])
			).toBe(true);
		});
	});
});
