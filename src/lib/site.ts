export const site = {
	name: 'Prescott Photo',
	legalName: 'Rubiconetic LLC dba Prescott Photo',
	url: 'https://prescottphoto.com',
	locale: 'en_US',
	region: 'Prescott, Arizona',
	/**
	 * Name set next to the logo in the header.
	 */
	brand: { name: 'Prescott Photo', tagline: 'Portraits by Michael Rubi' },
	/** Towns sessions are offered in without a travel fee, used in copy and structured data */
	serviceArea: ['Prescott', 'Prescott Valley', 'Chino Valley', 'Dewey-Humboldt', 'Sedona'],
	social: {
		instagram: 'https://www.instagram.com/rubigram/',
		facebook: 'https://www.facebook.com/MichaelRubiPhoto/'
	},
	/**
	 * n8n webhook (POST, URL-encoded) that receives booking inquiries and notifies
	 * Michael. It's called from the browser, so it must allow this site's origin.
	 */
	inquiryWebhook: 'https://n8n.rubiconetic.com/webhook/7fa008b1-a6b8-4664-9075-5434e66e4409',
	/**
	 * n8n webhook (POST, URL-encoded) told when a client submits their picks
	 * from a proofing gallery. Empty means no notification; picks still show
	 * up on /g/admin.
	 */
	picksWebhook: 'https://n8n.rubiconetic.com/webhook/c125007b-d63c-49a8-859c-7518acab38c4',
	/**
	 * n8n webhook (POST, URL-encoded) that prices a payment and opens a Stripe
	 * Checkout session for it, so the Stripe secret key stays in n8n. Empty
	 * hides online payment. See "Payments" in the README.
	 */
	checkoutWebhook: 'https://n8n.rubiconetic.com/webhook/c4593c16-ecbe-463f-a0ab-71f78ff3a0da'
} as const;

export const nav = [
	{ href: '/portraits', label: 'Portraits' },
	{ href: '/work', label: 'Work' },
	{ href: '/sessions', label: 'Sessions' },
	{ href: '/about', label: 'About' }
] as const;
