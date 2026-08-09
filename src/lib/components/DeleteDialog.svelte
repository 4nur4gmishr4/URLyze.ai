<script lang="ts">
	/**
	 * Confirmation dialog for destructive actions. Controlled by an `open` prop:
	 * when it turns true the native `<dialog>` opens (modal), when false it
	 * closes. Closes on Escape or backdrop click; focuses the cancel button on
	 * open. `onclose` is fired whenever the dialog closes so the parent can
	 * reset its state.
	 */

	let {
		open = false,
		title = 'Delete this item?',
		message = '',
		onconfirm,
		onclose
	}: {
		open?: boolean;
		title?: string;
		message?: string;
		onconfirm: () => void;
		onclose?: () => void;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let busy = $state(false);

	$effect(() => {
		if (open) {
			dialog?.showModal();
			dialog?.querySelector<HTMLButtonElement>('[data-cancel]')?.focus();
		} else if (dialog?.open) {
			dialog.close();
		}
	});

	function close(): void {
		if (dialog?.open) dialog.close();
		onclose?.();
	}

	async function confirm(): Promise<void> {
		if (busy) return;
		busy = true;
		try {
			await onconfirm();
		} finally {
			busy = false;
			close();
		}
	}

	function onBackdropClick(e: MouseEvent): void {
		if (!dialog) return;
		const rect = dialog.getBoundingClientRect();
		const inside =
			e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
		if (!inside) close();
	}
</script>

<dialog
	bind:this={dialog}
	class="dialog"
	aria-labelledby="dialog-title"
	onclose={onclose}
	onclick={onBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && close()}
>
	<div class="dialog-panel">
		<h2 id="dialog-title" class="dialog-title">{title}</h2>
		{#if message}<p class="dialog-message">{message}</p>{/if}
		<div class="dialog-actions">
			<button class="btn btn-secondary" data-cancel onclick={close} disabled={busy}>
				Cancel
			</button>
			<button class="btn btn-primary" onclick={confirm} disabled={busy}>
				{busy ? 'Deleting…' : 'Delete'}
			</button>
		</div>
	</div>
</dialog>

<style>
	.dialog {
		border: none;
		padding: 0;
		border-radius: var(--radius-lg);
		background: transparent;
		width: min(92vw, 420px);
	}
	.dialog::backdrop {
		background: rgba(0, 0, 0, 0.45);
	}
	.dialog-panel {
		background: var(--surface-1);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.dialog-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 500;
	}
	.dialog-message {
		margin: 0;
		font-size: 14px;
		line-height: 1.55;
		color: var(--text-secondary);
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}
</style>
