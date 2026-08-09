import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '$lib/types/errors';

/**
 * A fluent query-builder mock. Every builder method returns the same chain so
 * `select().from().where()...` composes; awaiting the chain resolves to the
 * next queued value, so each test controls what a query "returns".
 */
const { dbMock, queueRows, clearQueue } = vi.hoisted(() => {
	const methods = {
		select: vi.fn(),
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
		insert: vi.fn(),
		values: vi.fn(),
		returning: vi.fn(),
		delete: vi.fn()
	};
	const queue: unknown[] = [];
	// Awaiting the chain calls then(resolve); resolve the next queued value.
	const chain = {
		...methods,
		then: vi.fn((resolve: (value: unknown) => void) => resolve(queue.shift()))
	};
	for (const method of Object.values(methods)) method.mockReturnValue(chain);
	return {
		dbMock: chain,
		queueRows: (...rows: unknown[]) => void queue.push(...rows),
		clearQueue: () => void queue.splice(0, queue.length)
	};
});

vi.mock('$lib/server/db', () => ({ db: dbMock }));

import {
	serializeAnalysis,
	findAnalysisByCanonical,
	findAnalysisByContentHash,
	insertAnalysis,
	getAnalysisById,
	deleteAnalysisById,
	deleteAllAnalyses,
	listAnalyses
} from '$lib/server/db/analyses';
import type { AnalysisRow } from '$lib/server/db/schema';

const METHOD_KEYS = [
	'select',
	'from',
	'where',
	'orderBy',
	'limit',
	'offset',
	'insert',
	'values',
	'returning',
	'delete'
] as const;

function makeRow(overrides: Partial<AnalysisRow> = {}): AnalysisRow {
	return {
		id: '11111111-1111-1111-1111-111111111111',
		ownerId: 'anon-1',
		originalUrl: 'https://example.com/a',
		canonicalUrl: 'https://example.com/a',
		sourceType: 'WEBPAGE',
		title: 'An article',
		extractionLabel: 'Full article',
		sourceMetadata: { domain: 'example.com' },
		summary: 'Summary text.',
		notes: 'Notes text.',
		pptContent: JSON.stringify([{ title: 'Intro', points: ['a', 'b'] }]),
		contentHash: 'abc123',
		model: 'gemini-2.5-flash',
		promptVersion: 'v2',
		extractionQuality: 'HIGH',
		createdAt: new Date('2026-08-09T10:00:00Z'),
		updatedAt: new Date('2026-08-09T10:00:00Z'),
		...overrides
	};
}

const summaryRow = {
	id: 'row-1',
	ownerId: 'anon-1',
	originalUrl: 'https://example.com/a',
	canonicalUrl: 'https://example.com/a',
	sourceType: 'WEBPAGE' as const,
	title: 'An article',
	sourceMetadata: { domain: 'example.com' },
	extractionQuality: 'HIGH' as const,
	model: 'gemini-2.5-flash',
	createdAt: new Date('2026-08-09T10:00:00Z')
};

beforeEach(() => {
	for (const key of METHOD_KEYS) dbMock[key].mockClear();
	dbMock.then.mockClear();
	clearQueue();
});

describe('server/db/analyses', () => {
	describe('serializeAnalysis', () => {
		it('parses pptContent JSON and exposes an ISO date', () => {
			const out = serializeAnalysis(makeRow());
			expect(out.pptContent).toEqual([{ title: 'Intro', points: ['a', 'b'] }]);
			expect(out.createdAt).toBe('2026-08-09T10:00:00.000Z');
			expect(out.wasDuplicate).toBeUndefined();
		});

		it('passes the wasDuplicate flag through', () => {
			expect(serializeAnalysis(makeRow(), true).wasDuplicate).toBe(true);
		});
	});

	describe('findAnalysisByCanonical', () => {
		it('returns the newest matching row', async () => {
			const row = makeRow();
			queueRows([row]);
			const found = await findAnalysisByCanonical('anon-1', 'https://example.com/a');
			expect(found).toEqual(row);
		});

		it('returns undefined when nothing matches', async () => {
			queueRows([]);
			expect(await findAnalysisByCanonical('anon-1', 'https://example.com/a')).toBeUndefined();
		});
	});

	describe('findAnalysisByContentHash', () => {
		it('matches on the content hash', async () => {
			const row = makeRow();
			queueRows([row]);
			expect(await findAnalysisByContentHash('anon-1', 'abc123')).toEqual(row);
		});
	});

	describe('insertAnalysis', () => {
		it('returns the stored row', async () => {
			const row = makeRow();
			queueRows([row]);
			const [inserted] = await insertAnalysis(row);
			expect(inserted.id).toBe(row.id);
		});
	});

	describe('getAnalysisById', () => {
		it('returns the row when it belongs to the owner', async () => {
			const row = makeRow();
			queueRows([row]);
			expect(await getAnalysisById('anon-1', row.id)).toEqual(row);
		});

		it('throws NOT_FOUND for a foreign or missing row', async () => {
			queueRows([]);
			await expect(getAnalysisById('anon-1', 'row-x')).rejects.toBeInstanceOf(AppError);
		});
	});

	describe('deleteAnalysisById', () => {
		it('reports true only when a row was deleted', async () => {
			queueRows([{ id: 'row-1' }]);
			expect(await deleteAnalysisById('anon-1', 'row-1')).toBe(true);
			queueRows([]);
			expect(await deleteAnalysisById('anon-1', 'row-1')).toBe(false);
		});
	});

	describe('deleteAllAnalyses', () => {
		it('counts the deleted rows', async () => {
			queueRows([{ id: 'a' }, { id: 'b' }]);
			expect(await deleteAllAnalyses('anon-1')).toBe(2);
		});
	});

	describe('listAnalyses', () => {
		it('lists with default pagination and a real total', async () => {
			queueRows([summaryRow], [{ count: 2 }]);
			const out = await listAnalyses('anon-1', {});
			expect(out.rows).toEqual([summaryRow]);
			expect(out.total).toBe(2);
			expect(out.limit).toBe(50);
			expect(out.offset).toBe(0);
		});

		it('clamps limit and offset to sane bounds', async () => {
			queueRows([], [{ count: 0 }]);
			const out = await listAnalyses('anon-1', { limit: 999, offset: -5 });
			expect(out.limit).toBe(100);
			expect(out.offset).toBe(0);
		});

		it('handles search, filter and sort without crashing', async () => {
			queueRows([], [{ count: 0 }]);
			const out = await listAnalyses('anon-1', {
				search: '  gemini  ',
				sourceType: 'YOUTUBE',
				sort: 'oldest'
			});
			expect(out.total).toBe(0);
		});
	});
});
