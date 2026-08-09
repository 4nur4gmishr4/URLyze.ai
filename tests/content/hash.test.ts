import { describe, it, expect } from 'vitest';
import { contentHash, normalizeForHash, countWords } from '$lib/server/content/hash';

describe('content/hash', () => {
	describe('normalizeForHash', () => {
		it('collapses runs of whitespace to a single space', () => {
			expect(normalizeForHash('a\n\n  b\t c')).toBe('a b c');
		});

		it('trims surrounding whitespace and lowercases', () => {
			expect(normalizeForHash('  Hello World  ')).toBe('hello world');
		});

		it('treats formatting-only changes as identical', () => {
			expect(normalizeForHash('One\ntwo\nthree')).toBe(normalizeForHash('One two three'));
		});
	});

	describe('contentHash', () => {
		it('is deterministic', () => {
			expect(contentHash('same text')).toBe(contentHash('same text'));
		});

		it('differs when the meaning changes', () => {
			expect(contentHash('version one')).not.toBe(contentHash('version two'));
		});

		it('is stable under whitespace formatting drift', () => {
			expect(contentHash('The quick\nbrown fox')).toBe(contentHash('The   quick brown   fox'));
		});
	});

	describe('countWords', () => {
		it('counts words by whitespace split', () => {
			expect(countWords('one two three')).toBe(3);
		});

		it('returns 0 for empty and whitespace-only text', () => {
			expect(countWords('')).toBe(0);
			expect(countWords('   \n ')).toBe(0);
		});

		it('collapses repeated spaces when counting', () => {
			expect(countWords('a  b   c')).toBe(3);
		});
	});
});
