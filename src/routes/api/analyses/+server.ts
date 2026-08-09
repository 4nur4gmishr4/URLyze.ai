import { json, error } from '@sveltejs/kit';
import { sourceTypeSchema } from '$lib/types/analysis';
import { ensureSessionId } from '$lib/server/session';
import { listAnalyses } from '$lib/server/db/analyses';
import { AppError } from '$lib/types/errors';

/**
 * GET /api/analyses
 *
 * History list for the current visitor, scoped by session cookie. Supports
 * `?search=`, `?sourceType=`, `?sort=newest|oldest`, `?limit=`, `?offset=`.
 * Returns a paginated envelope so the client can render "showing x of y".
 */
export async function GET(event) {
	try {
		const ownerId = ensureSessionId(event);
		const url = new URL(event.request.url);

		const search = url.searchParams.get('search') ?? undefined;
		const parsedSourceType = sourceTypeSchema.safeParse(url.searchParams.get('sourceType'));
		const sourceType = parsedSourceType.success ? parsedSourceType.data : undefined;
		const sort = url.searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
		const limit = Number(url.searchParams.get('limit') ?? 50);
		const offset = Number(url.searchParams.get('offset') ?? 0);

		const result = await listAnalyses(ownerId, { search, sourceType, sort, limit, offset });
		return json(result);
	} catch (e) {
		if (e instanceof AppError) throw error(e.status, { code: e.code, message: e.message });
		throw e;
	}
}
