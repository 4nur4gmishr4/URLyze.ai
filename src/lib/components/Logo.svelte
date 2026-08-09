<script lang="ts">
	/** The animated URLyze logo (SMIL, ~2s loop), shared by header and footer. */

	interface Props {
		size?: number;
		alt?: string;
	}

	let { size = 34, alt = 'URLyze' }: Props = $props();
</script>

<img
	src="/URLyze_logo.svg"
	class="logo"
	{alt}
	width={size}
	height={size}
	style={`width:${size}px;height:${size}px`}
	draggable="false"
/>

<style>
	.logo {
		display: inline-block;
		flex-shrink: 0;
		user-select: none;
		-webkit-user-drag: none;
	}
</style>
