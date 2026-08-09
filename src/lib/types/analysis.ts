import { z } from 'zod';

/** The kind of content the submitted URL pointed to. */
export const sourceTypeSchema = z.enum(['YOUTUBE', 'WEBPAGE']);

export type SourceType = z.infer<typeof sourceTypeSchema>;

/** Shape of the request body for POST /api/analyze. */
export const analyzeRequestSchema = z.object({
	url: z.string().max(2048)
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/** How complete the extracted source content was. Drives the trust indicator. */
export const extractionQualitySchema = z.enum(['HIGH', 'GOOD', 'LIMITED']);

export type ExtractionQuality = z.infer<typeof extractionQualitySchema>;

/** Source metadata surfaced in the dashboard header (only fields actually extracted). */
export const sourceMetadataSchema = z.object({
	// YouTube
	videoId: z.string().optional(),
	channelName: z.string().optional(),
	channelUrl: z.string().optional(),
	durationSeconds: z.number().int().nonnegative().optional(),
	// Web
	domain: z.string().optional(),
	description: z.string().optional(),
	author: z.string().optional(),
	publishedAt: z.string().optional(),
	canonicalUrl: z.string().optional(),
	language: z.string().optional(),
	readingMinutes: z.number().int().nonnegative().optional(),
	// both
	wordCount: z.number().int().nonnegative().optional()
});

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;

/** One slide in the slide-outline artifact. */
export const slideSchema = z.object({
	title: z.string().max(500),
	points: z.array(z.string().max(2000)).max(20)
});

export type Slide = z.infer<typeof slideSchema>;

/** The three artifacts produced by Gemini. */
export const artifactsSchema = z.object({
	summary: z.string().max(20_000),
	notes: z.string().max(60_000),
	pptContent: z.array(slideSchema).max(30)
});

export type Artifacts = z.infer<typeof artifactsSchema>;

/** Raw extraction output before it reaches the LLM. */
export interface ExtractedContent {
	type: SourceType;
	title: string;
	text: string;
	/** true when extraction degraded to a fallback source (description instead of transcript). */
	isFallback: boolean;
	/** What kind of text was extracted — shown to the user as the EXTRACTION row. */
	extractionLabel: string;
	metadata: SourceMetadata;
	/** sha-256 of the normalized text, used for duplicate detection. */
	contentHash: string;
	/** Word count of the extracted text. */
	wordCount: number;
	quality: ExtractionQuality;
}

/** The source identity used for duplicate/cache lookups. */
export interface CanonicalIdentity {
	/** e.g. `YOUTUBE:ABC123` or `WEB:https://example.com/article`. */
	canonical: string;
	/** Full canonical URL (tracking params stripped, normalized). */
	url: string;
}

/** A row in the `analyses` table. */
export interface AnalysisRecord {
	id: string;
	ownerId: string;
	originalUrl: string;
	canonicalUrl: string;
	sourceType: SourceType;
	title: string;
	sourceMetadata: SourceMetadata;
	summary: string;
	notes: string;
	pptContent: Slide[];
	contentHash: string;
	model: string;
	promptVersion: string;
	extractionQuality: ExtractionQuality;
	createdAt: Date;
	updatedAt: Date;
}

/** The payload returned to the client after a successful analysis. */
export interface AnalysisResult {
	id: string;
	title: string;
	sourceType: SourceType;
	originalUrl: string;
	sourceMetadata: SourceMetadata;
	quality: ExtractionQuality;
	extractionLabel: string;
	model: string;
	summary: string;
	notes: string;
	pptContent: Slide[];
	createdAt: string;
	/** true when this analysis was served from an earlier duplicate (no re-run). */
	wasDuplicate?: boolean;
}

/** Public, serializable projection of an analysis for lists. */
export interface AnalysisSummary {
	id: string;
	ownerId: string;
	originalUrl: string;
	canonicalUrl: string;
	sourceType: SourceType;
	title: string;
	sourceMetadata: SourceMetadata;
	extractionQuality: ExtractionQuality;
	model: string;
	createdAt: string;
}

/** Query options for the history list endpoint. */
export interface HistoryQuery {
	search?: string;
	sourceType?: SourceType;
	sort?: 'newest' | 'oldest';
	limit?: number;
	offset?: number;
}

/** Error shape delivered to the client from any API endpoint. */
export interface ApiErrorBody {
	code: string;
	message: string;
	detail?: string;
	requestId?: string;
}

/** Fields Gemini is allowed to know about the source. */
export interface LlmInput {
	title: string;
	type: SourceType;
	text: string;
	extractionLabel: string;
	language: string;
}
