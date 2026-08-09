import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import { AppError } from '$lib/types/errors';
import type { AnalysisResult, HistoryQuery, Slide } from '$lib/types/analysis';
import { db } from './index';
import { analyses, type AnalysisRow, type NewAnalysisRow } from './schema';

/** Convert a stored row into the public, serializable analysis shape. */
export function serializeAnalysis(row: AnalysisRow, wasDuplicate?: boolean): AnalysisResult {
	return {
		id: row.id,
		title: row.title,
		sourceType: row.sourceType,
		originalUrl: row.originalUrl,
		sourceMetadata: row.sourceMetadata,
		quality: row.extractionQuality,
		extractionLabel: row.extractionLabel,
		model: row.model,
		summary: row.summary,
		notes: row.notes,
		pptContent: JSON.parse(row.pptContent) as Slide[],
		createdAt: row.createdAt.toISOString(),
		wasDuplicate
	};
}

/**
 * Query helpers for the `analyses` table.
 *
 * Every read/write is scoped by `ownerId` — the anonymous session id — so a
 * visitor can never see, read, or delete another visitor's rows. Duplicate
 * detection happens at two levels: same canonical URL (a re-submission of the
 * same link) and same content hash (the same video/page reached via a
 * different URL shape or a changed link that still maps to identical text).
 */

/** Reuse an analysis when this visitor already analyzed the same canonical URL. */
export async function findAnalysisByCanonical(ownerId: string, canonicalUrl: string) {
	const rows = await db
		.select()
		.from(analyses)
		.where(and(eq(analyses.ownerId, ownerId), eq(analyses.canonicalUrl, canonicalUrl)))
		.orderBy(desc(analyses.createdAt))
		.limit(1);
	return rows[0];
}

/** Reuse an analysis when the extracted text hash matches (content-level dedup). */
export async function findAnalysisByContentHash(ownerId: string, contentHash: string) {
	const rows = await db
		.select()
		.from(analyses)
		.where(and(eq(analyses.ownerId, ownerId), eq(analyses.contentHash, contentHash)))
		.orderBy(desc(analyses.createdAt))
		.limit(1);
	return rows[0];
}

/** Insert a finished analysis and return the stored row. */
export async function insertAnalysis(row: NewAnalysisRow) {
	return db.insert(analyses).values(row).returning();
}

/** Get one analysis by id, throwing NOT_FOUND when it isn't this visitor's. */
export async function getAnalysisById(ownerId: string, id: string) {
	const [row] = await db
		.select()
		.from(analyses)
		.where(and(eq(analyses.id, id), eq(analyses.ownerId, ownerId)))
		.limit(1);
	if (!row) throw new AppError('NOT_FOUND', 'That analysis was not found');
	return row;
}

/** Delete one analysis by id (ownership-scoped). Returns true when deleted. */
export async function deleteAnalysisById(ownerId: string, id: string): Promise<boolean> {
	const result = await db
		.delete(analyses)
		.where(and(eq(analyses.id, id), eq(analyses.ownerId, ownerId)))
		.returning({ id: analyses.id });
	return result.length > 0;
}

/** List this visitor's analyses with search / filter / sort / pagination. */
export async function listAnalyses(ownerId: string, query: HistoryQuery) {
	const term = query.search?.trim();
	const filters = [eq(analyses.ownerId, ownerId)];
	if (term) {
		const pattern = `%${term}%`;
		filters.push(
			or(sql`${analyses.title} ILIKE ${pattern}`, sql`${analyses.originalUrl} ILIKE ${pattern}`) as never
		);
	}
	if (query.sourceType) filters.push(eq(analyses.sourceType, query.sourceType));

	const order = query.sort === 'oldest' ? asc(analyses.createdAt) : desc(analyses.createdAt);
	const limit = Math.min(query.limit ?? 50, 100);
	const offset = Math.max(query.offset ?? 0, 0);

	const rows = await db
		.select({
			id: analyses.id,
			ownerId: analyses.ownerId,
			originalUrl: analyses.originalUrl,
			canonicalUrl: analyses.canonicalUrl,
			sourceType: analyses.sourceType,
			title: analyses.title,
			sourceMetadata: analyses.sourceMetadata,
			extractionQuality: analyses.extractionQuality,
			model: analyses.model,
			createdAt: analyses.createdAt
		})
		.from(analyses)
		.where(and(...filters))
		.orderBy(order)
		.limit(limit)
		.offset(offset);

	const [countRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(analyses)
		.where(and(...filters));

	return {
		rows,
		total: Number(countRow?.count ?? 0),
		limit,
		offset
	};
}
