<script lang="ts">
	import Button from './Button.svelte';

	/**
	 * Copies the passed text to the clipboard and swaps its label to a brief
	 * "Copied" confirmation. Falls back to a textarea+execCommand path for
	 * older browsers that lack the async clipboard API.
	 */

	let { text, label = 'Copy' }: { text: string; label?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	async function onCopy(): Promise<void> {
		let ok = false;
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
				ok = true;
			}
		} catch {
			ok = false;
		}
		if (!ok) ok = legacyCopy(text);

		copied = ok;
		if (ok) {
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		}
	}

	function legacyCopy(value: string): boolean {
		const ta = document.createElement('textarea');
		ta.value = value;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		let ok = false;
		try {
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}
		ta.remove();
		return ok;
	}
</script>

<Button variant="secondary" onclick={onCopy} class="copy-btn">
	{#if copied}
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
		Copied
	{:else}
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect width="14" height="14" x="8" y="8" rx="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
		{label}
	{/if}
</Button>
