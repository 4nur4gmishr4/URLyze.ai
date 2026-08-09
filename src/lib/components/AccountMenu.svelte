<script lang="ts">
	import type { SessionUser } from '$lib/types/session';

	/**
	 * Account state for the header and sidebar. Signed out: a "Continue with
	 * Google" button that starts the OAuth flow. Signed in: avatar, name,
	 * email, and a POST-only sign-out form.
	 */

	let { user }: { user: SessionUser | null } = $props();

	function initial(name: string): string {
		return name.charAt(0).toUpperCase();
	}
</script>

{#if user}
	<div class="account">
		{#if user.picture}
			<img
				src={user.picture}
				alt=""
				class="avatar"
				width="32"
				height="32"
				referrerpolicy="no-referrer"
				loading="lazy"
			/>
		{:else}
			<span class="avatar fallback" aria-hidden="true">{initial(user.name)}</span>
		{/if}
		<span class="who">
			<span class="name">{user.name}</span>
			<span class="email">{user.email}</span>
		</span>
		<form method="POST" action="/api/auth/signout">
			<button type="submit" class="signout">Sign out</button>
		</form>
	</div>
{:else}
	<a href="/api/auth/google" class="google">
		<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
			<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
			<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
			<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
			<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
		</svg>
		<span class="google-label">Continue with Google</span>
	</a>
{/if}

<style>
	.account {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
	.avatar.fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-accent);
		color: var(--accent);
		font-weight: 600;
		font-size: 15px;
	}
	.who {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.email {
		font-size: 11px;
		color: var(--text-faint);
	}
	.signout {
		background: transparent;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		padding: 6px 12px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: border-color var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out);
	}
	.signout:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.google {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 9px 16px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		background: var(--canvas);
		color: var(--text);
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		transition: border-color var(--duration-fast) var(--ease-out),
			box-shadow var(--duration-fast) var(--ease-out);
	}
	.google:hover {
		border-color: var(--accent);
		box-shadow: 0 2px 10px rgb(0 0 0 / 0.06);
		text-decoration: none;
	}
	.google svg {
		flex-shrink: 0;
	}
</style>
