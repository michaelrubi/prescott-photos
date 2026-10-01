export const site = {
	name: 'Michael Rubi Photography',
	legalName: 'Michael Rubi Photography LLC',
	url: 'https://prescottphotos.com',
	locale: 'en_US',
	region: 'Prescott, Arizona',
	/** Towns sessions are offered in without a travel fee, used in copy and structured data */
	serviceArea: ['Prescott', 'Prescott Valley', 'Chino Valley', 'Dewey-Humboldt', 'Sedona'],
	social: {
		instagram: 'https://www.instagram.com/rubigram/',
		facebook: 'https://www.facebook.com/MichaelRubiPhoto/'
	},
	/**
	 * n8n webhook (POST, JSON) that receives booking inquiries and notifies
	 * Michael. It's called from the browser, so it must allow this site's origin.
	 */
	inquiryWebhook: ''
} as const;

export const nav = [
	{ href: '/portraits', label: 'Portraits' },
	{ href: '/work', label: 'Work' },
	{ href: '/sessions', label: 'Sessions' },
	{ href: '/about', label: 'About' }
] as const;
