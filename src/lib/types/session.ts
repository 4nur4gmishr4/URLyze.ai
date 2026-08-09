/**
 * Public, serializable shape of a signed-in user. Shared between the server
 * (user-session) and client (AccountMenu) without dragging server imports
 * into the browser bundle.
 */
export interface SessionUser {
	id: string;
	name: string;
	email: string;
	picture?: string;
}
