import type {
	AnalysisResult,
	AnalysisSummary,
	SourceType,
	ApiErrorBody
} from '$lib/types/analysis';

/**
 * Typed client for the API. All endpoints return `ApiError` on failure with
 * the server's code + requestId so the UI can show distinct, honest messages
 * (rate-limited vs blocked vs AI down vs our bug).
 */

export interface HistoryResponse {
	rows: AnalysisSummary[];
	total: number;
	limit: number;
	offset: number;
}

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly detail?: string;
	readonly requestId?: string;

	constructor(status: number, body: ApiErrorBody) {
		super(body.message);
		this.name = 'ApiError';
		this.status = status;
		this.code = body.code;
		this.detail = body.detail;
		this.requestId = body.requestId ?? undefined;
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(path, {
			...init,
			headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
		});
	} catch {
		throw new ApiError(0, {
			code: 'NETWORK_ERROR',
			message: 'Could not reach the server — check your connection and try again'
		});
	}

	if (res.ok) return (await res.json()) as T;

	// Server errors always carry the ApiErrorBody shape; guard against junk.
	let body: ApiErrorBody;
	try {
		body = (await res.json()) as ApiErrorBody;
	} catch {
		body = { code: 'INTERNAL', message: 'An unexpected error occurred' };
	}
	throw new ApiError(res.status, body);
}

/** POST /api/analyze — full pipeline, returns the three artifacts. */
export function analyze(url: string, signal?: AbortSignal): Promise<AnalysisResult> {
	return request<AnalysisResult>('/api/analyze', {
		method: 'POST',
		signal,
		body: JSON.stringify({ url })
	});
}

/** GET /api/analyses — history list with search/filter/pagination. */
export function listAnalyses(params: {
	search?: string;
	sourceType?: SourceType;
	sort?: 'newest' | 'oldest';
	limit?: number;
	offset?: number;
	signal?: AbortSignal;
}): Promise<HistoryResponse> {
	const q = new URLSearchParams();
	if (params.search) q.set('search', params.search);
	if (params.sourceType) q.set('sourceType', params.sourceType);
	if (params.sort) q.set('sort', params.sort);
	if (params.limit !== undefined) q.set('limit', String(params.limit));
	if (params.offset !== undefined) q.set('offset', String(params.offset));
	const qs = q.toString();
	return request<HistoryResponse>(`/api/analyses${qs ? `?${qs}` : ''}`, { signal: params.signal });
}

/** GET /api/analyses/[id] — one analysis. */
export function getAnalysis(id: string, signal?: AbortSignal): Promise<AnalysisResult> {
	return request<AnalysisResult>(`/api/analyses/${id}`, { signal });
}

/** DELETE /api/analyses/[id] — remove one analysis. */
export function deleteAnalysis(id: string): Promise<{ ok: true }> {
	return request<{ ok: true }>(`/api/analyses/${id}`, { method: 'DELETE' });
}

/** DELETE /api/analyses — clear the visitor's entire history. */
export function clearAllAnalyses(): Promise<{ ok: true; deleted: number }> {
	return request<{ ok: true; deleted: number }>('/api/analyses', { method: 'DELETE' });
}
