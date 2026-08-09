import { randomBytes } from 'node:crypto';

/**
 * Request IDs give users a stable token to reference when something goes
 * wrong. `ULZ-XXXXX` is short enough to read over the phone and unambiguous.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/1/0 — avoids mistyping

/** Generate a `ULZ-XXXXX` request id (cryptographically random). */
export function newRequestId(): string {
	let out = '';
	const bytes = randomBytes(5);
	for (let i = 0; i < 5; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
	return `ULZ-${out}`;
}
