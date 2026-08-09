import type { ErrorCode } from '$lib/types/errors';

declare global {
	namespace App {
		/** Shape of every JSON error body returned by the API. */
		interface Error {
			code: ErrorCode;
			message: string;
			detail?: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
