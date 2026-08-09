<script lang="ts">
	import { goto } from '$app/navigation';
	import LandingHero from '$lib/components/LandingHero.svelte';
	import HowItWorks from '$lib/components/HowItWorks.svelte';
	import TrustSection from '$lib/components/TrustSection.svelte';

	/** Landing page — hero form hands the URL off to the dashboard via ?url=. */

	let loading = $state(false);
	let error = $state('');

	async function onsubmit(url: string): Promise<void> {
		error = '';
		loading = true;
		try {
			await goto(`/dashboard?url=${encodeURIComponent(url)}`);
		} catch {
			// goto rarely throws; if navigation is interrupted, let the button recover.
		} finally {
			loading = false;
		}
	}
</script>

<LandingHero {loading} {error} {onsubmit} />
<HowItWorks />
<TrustSection />
