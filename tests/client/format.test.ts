import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
	formatDate,
	relativeTime,
	formatWordCount,
	readingMinutes,
	formatDuration
} from '$lib/client/format';

describe('client/format', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('formatDate', () => {
		it('renders a stable short date', () => {
			expect(formatDate('2026-08-09T12:00:00Z')).toBe('9 Aug 2026');
		});

		it('returns empty for an unparseable date', () => {
			expect(formatDate('not-a-date')).toBe('');
		});
	});

	describe('relativeTime', () => {
		const NOW = 1_000_000_000_000;
		beforeEach(() => {
			vi.spyOn(Date, 'now').mockReturnValue(NOW);
		});

		it('says just now for under a minute', () => {
			expect(relativeTime(new Date(NOW - 30_000).toISOString())).toBe('just now');
		});

		it('reports minutes, hours, and days', () => {
			expect(relativeTime(new Date(NOW - 5 * 60_000).toISOString())).toBe('5m ago');
			expect(relativeTime(new Date(NOW - 2 * 3_600_000).toISOString())).toBe('2h ago');
			expect(relativeTime(new Date(NOW - 3 * 86_400_000).toISOString())).toBe('3d ago');
		});

		it('reports months past thirty days', () => {
			expect(relativeTime(new Date(NOW - 45 * 86_400_000).toISOString())).toBe('1mo ago');
		});

		it('returns empty for an unparseable date', () => {
			expect(relativeTime('nope')).toBe('');
		});
	});

	describe('formatWordCount', () => {
		it('groups thousands with a comma', () => {
			expect(formatWordCount(1243)).toBe('1,243 words');
		});

		it('returns empty when count is missing', () => {
			expect(formatWordCount(undefined)).toBe('');
		});
	});

	describe('readingMinutes', () => {
		it('rounds to the nearest minute at 200 wpm', () => {
			expect(readingMinutes(7542)).toBe('~38 min read');
		});

		it('never reports zero minutes', () => {
			expect(readingMinutes(50)).toBe('~1 min read');
		});

		it('returns empty when count is missing', () => {
			expect(readingMinutes(undefined)).toBe('');
		});
	});

	describe('formatDuration', () => {
		it('splits hours and minutes', () => {
			expect(formatDuration(4200)).toBe('1h 10m');
		});

		it('omits the hour when under sixty minutes', () => {
			expect(formatDuration(600)).toBe('10m');
		});

		it('returns empty when duration is missing', () => {
			expect(formatDuration(undefined)).toBe('');
		});
	});
});
