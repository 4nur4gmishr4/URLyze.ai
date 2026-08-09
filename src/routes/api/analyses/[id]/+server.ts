import { json, error } from '@sveltejs/kit';
import { ensureSessionId } from '$lib/server/session';
import { getAnalysisById, deleteAnalysisById, serializeAnalysis } from '$lib/server/db/analyses';
import { AppError } from '$lib/types/errors';

/** UUID shape — reject anything else before it reaches the query planner. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(event) {
	try {
		const id = event.params.id;
		if (!UUID_RE.test(id)) throw new AppError('VALIDATION', 'Invalid analysis id');

		const ownerId = ensureSessionId(event);
		const row = await getAnalysisById(ownerId, id);
		return json(serializeAnalysis(row));
	} catch (e) {
		if (e instanceof AppError) throw error(e.status, { code: e.code, message: e.message });
		throw e;
	}
}

export async function DELETE(event) {
	try {
		const id = event.params.id;
		if (!UUID_RE.test(id)) throw new AppError('VALIDATION', 'Invalid analysis id');

		const ownerId = ensureSessionId(event);
		const deleted = await deleteAnalysisById(ownerId, id);
		if (!deleted) throw new AppError('NOT_FOUND', 'That analysis was not found');
		return json({ ok: true });
	} catch (e) {
		if (e instanceof AppError) throw error(e.status, { code: e.code, message: e.message });
		throw e;
	}
}
