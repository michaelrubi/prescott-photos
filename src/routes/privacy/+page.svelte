<script lang="ts">
	import PageIntro from '#lib/components/PageIntro.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/site.ts';
</script>

<Seo title="Privacy Policy | {site.name}" description="What information {site.name} collects, why, and how it's handled." />

<main>
	<PageIntro label="Legal" title="Privacy policy" lead="I collect as little as possible and never sell it. Last updated October 2026." />

	<article class="prose">
		<h2>What I collect</h2>
		<p>
			When you send an inquiry through the booking form, I receive the details you enter: your name, email address,
			session preferences and message. It is sent to my inbox through Google Firebase and the email service Resend,
			which process it only to deliver that email.
		</p>
		<p>
			This website does not use advertising trackers or analytics cookies. The hosting provider, Google Firebase,
			keeps standard server logs such as IP addresses for security.
		</p>

		<h2>How I use it</h2>
		<p>
			Only to reply to your inquiry, plan your session and deliver your photos. I don't add you to a mailing list and
			I never sell or share your information with marketers.
		</p>

		<h2>Your photos</h2>
		<p>
			Client galleries are private and shared only through a link I send you. Location data is removed from every
			image published on this website. I will only feature your images publicly with your permission.
		</p>

		<h2>Your choices</h2>
		<p>
			You can ask me to show you, correct or delete the information I hold about you at any time through the
			<a href="/book">booking page</a>.
		</p>
	</article>
</main>

<style>
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--gutter);
	}
</style>
