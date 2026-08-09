import ipaddr from 'ipaddr.js';
import { lookup } from 'node:dns/promises';

/**
 * SSRF IP guard.
 *
 * A request is allowed to reach a host only if every resolved address is
 * a global unicast IP. `ipaddr.range(addr, 'unicast')` is false for private,
 * loopback, link-local (incl. 169.254.169.254 cloud metadata), CGNAT,
 * multicast, broadcast, unspecified, and reserved ranges — exactly the
 * targets SSRF protects.
 */

export interface ResolvedAddress {
	address: string;
	family: 4 | 6;
}

/** Normalize an address, unwrapping IPv4-mapped IPv6 (`::ffff:1.2.3.4` → `1.2.3.4`). */
export function normalizeIp(address: string): string {
	const parsed = ipaddr.parse(address);
	if (parsed.kind() === 'ipv6' && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
		return (parsed as ipaddr.IPv6).toIPv4Address().toString();
	}
	return address;
}

/** True when the address is a global unicast IP that is safe to reach. */
export function isGlobalUnicast(address: string): boolean {
	const normalized = normalizeIp(address);
	const parsed = ipaddr.parse(normalized);
	return parsed.range() === 'unicast';
}

/** Resolve a hostname to all of its A/AAAA records. */
export async function resolveAddresses(hostname: string): Promise<ResolvedAddress[]> {
	const records = await lookup(hostname, { all: true, verbatim: true });
	return records.map((r) => ({
		address: r.address,
		family: r.family === 6 ? 6 : 4
	}));
}

/** True if any resolved address is unsafe (not global unicast). */
export function hasBlockedAddress(addresses: ResolvedAddress[]): boolean {
	return addresses.some((a) => !isGlobalUnicast(a.address));
}

/** Resolve and validate; returns the safe addresses or throws on any block. */
export async function resolveAndValidate(hostname: string): Promise<ResolvedAddress[]> {
	let addresses: ResolvedAddress[];
	try {
		addresses = await resolveAddresses(hostname);
	} catch (err) {
		throw new Error(`DNS resolution failed for ${hostname}`, { cause: err });
	}
	if (addresses.length === 0) {
		throw new Error(`No addresses resolved for ${hostname}`);
	}
	if (hasBlockedAddress(addresses)) {
		throw new Error(`Blocked non-unicast address for ${hostname}`);
	}
	return addresses;
}
