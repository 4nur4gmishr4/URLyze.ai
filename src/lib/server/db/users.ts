import { eq } from 'drizzle-orm';
import { db } from './index';
import { users, type UserRow } from './schema';

/**
 * Find-or-create a user from a verified Google identity. Keyed on the stable
 * `google_sub`; when the account exists we refresh the mutable profile fields
 * so a changed Google name/photo shows up on the next login.
 */
export async function upsertUserByGoogle(input: {
	sub: string;
	email: string;
	name: string;
	picture?: string;
}): Promise<UserRow> {
	const existing = await db.select().from(users).where(eq(users.googleSub, input.sub)).limit(1);
	if (existing[0]) {
		const [updated] = await db
			.update(users)
			.set({
				email: input.email,
				name: input.name,
				picture: input.picture ?? null,
				updatedAt: new Date()
			})
			.where(eq(users.id, existing[0].id))
			.returning();
		return updated;
	}

	const [created] = await db
		.insert(users)
		.values({
			googleSub: input.sub,
			email: input.email,
			name: input.name,
			picture: input.picture ?? null
		})
		.returning();
	return created;
}
