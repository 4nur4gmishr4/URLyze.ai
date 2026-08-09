import { pgTable, text, timestamp, uuid, jsonb, varchar } from 'drizzle-orm/pg-core';
import type { SourceMetadata } from '$lib/types/analysis';

/**
 * One analyzed URL with its three artifacts.
 *
 * The extra columns beyond the MVP shape power the production features:
 *  - `owner_id` — anonymous ownership via session cookie (each visitor only
 *    ever sees their own rows).
 *  - `canonical_url` + `content_hash` — duplicate detection. Same normalized
 *    URL or same extracted text ⇒ serve the cached analysis instead of paying
 *    for Gemini again.
 *  - `source_metadata` — the YouTube/Web facts surfaced in the dashboard
 *    header, stored as JSONB so schema can evolve without migrations.
 *  - `model` + `prompt_version` — provenance for debugging and A/B on prompts.
 */
export const analyses = pgTable('analyses', {
	id: uuid('id').primaryKey().defaultRandom(),
	ownerId: varchar('owner_id', { length: 64 }).notNull(),
	originalUrl: text('original_url').notNull(),
	canonicalUrl: text('canonical_url').notNull(),
	sourceType: text('source_type', { enum: ['YOUTUBE', 'WEBPAGE'] }).notNull(),
	title: text('title').notNull(),
	extractionLabel: text('extraction_label').notNull(),
	sourceMetadata: jsonb('source_metadata').$type<SourceMetadata>().notNull().default({}),
	summary: text('summary').notNull(),
	notes: text('notes').notNull(),
	pptContent: text('ppt_content').notNull(), // JSON string of Slide[]
	contentHash: varchar('content_hash', { length: 64 }).notNull(),
	model: varchar('model', { length: 100 }).notNull(),
	promptVersion: varchar('prompt_version', { length: 32 }).notNull(),
	extractionQuality: text('extraction_quality', {
		enum: ['HIGH', 'GOOD', 'LIMITED']
	}).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * A signed-in user (currently only via Google OAuth).
 *
 * `google_sub` is the stable Google subject id and the unique key we upsert
 * on; `email` is unique so one account can't silently split across devices.
 * Analyses written while signed in are owned by `user:<id>` (see
 * `ownerIdForUser`), which is what gives the account cross-device history.
 */
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	googleSub: varchar('google_sub', { length: 64 }).notNull().unique(),
	email: varchar('email', { length: 320 }).notNull().unique(),
	name: varchar('name', { length: 120 }).notNull(),
	picture: varchar('picture', { length: 2048 }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export type AnalysisRow = typeof analyses.$inferSelect;
export type NewAnalysisRow = typeof analyses.$inferInsert;
