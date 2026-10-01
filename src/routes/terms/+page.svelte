<script lang="ts">
	import PageIntro from '#lib/components/PageIntro.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/site.ts';
</script>

<Seo title="Terms & Conditions | {site.name}" description="Booking, payment, rescheduling and image use terms for {site.name} sessions." />

<main>
	<PageIntro label="Legal" title="Terms & conditions" lead="The short version of how booking a session works. Last updated October 2026." />

	<article class="prose">
		<h2>Booking and payment</h2>
		<p>
			A $100 non-refundable retainer reserves your session date and is credited toward your package. The remaining
			balance is due after your session, before your gallery is delivered.
		</p>

		<h2>Rescheduling and cancellations</h2>
		<p>
			You can reschedule once at no cost with at least 48 hours' notice, and your retainer carries over. If weather
			or safety makes a session impractical, I will reschedule at no cost. Cancellations forfeit the retainer.
		</p>

		<h2>Delivery</h2>
		<p>
			Edited images are delivered through a private online gallery within the time stated for your package, usually
			two weeks. Please download your images soon after delivery; galleries stay online for at least 90 days.
		</p>

		<h2>Image use</h2>
		<p>
			{site.legalName} keeps the copyright to all images. You receive a personal-use license to download, share and
			print your images, including on social media. Commercial use, such as advertising, needs written permission;
			personal branding sessions include use on your own website and social profiles.
		</p>
		<p>
			With your permission, I may share a few favorite images from your session in my portfolio or on social media.
			Just say so if you'd rather I didn't.
		</p>

		<h2>Retouching</h2>
		<p>
			Every delivered image is edited by hand. Retouching covers temporary things like blemishes and stray hairs;
			heavier changes to body shape or background are not included.
		</p>

		<h2>Liability</h2>
		<p>
			In the unlikely event that images are lost or a session cannot be completed for reasons beyond my control, my
			liability is limited to refunding the amount you paid.
		</p>

		<h2>Questions</h2>
		<p>Reach out through the <a href="/book">booking page</a> with any questions about these terms.</p>
	</article>
</main>

<style>
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--gutter);
	}
</style>
