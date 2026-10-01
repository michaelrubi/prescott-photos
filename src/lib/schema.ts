import { site } from './site.ts';

/** Structured data shared across pages, so Google can describe the business. */

export const person = {
	'@type': 'Person',
	'@id': `${site.url}/about#michael`,
	name: 'Michael Rubi',
	jobTitle: 'Portrait photographer',
	url: `${site.url}/about`,
	sameAs: Object.values(site.social),
	address: { '@type': 'PostalAddress', addressLocality: 'Prescott', addressRegion: 'AZ', addressCountry: 'US' }
};

export function business(image?: string) {
	return {
		'@type': 'ProfessionalService',
		'@id': `${site.url}/#business`,
		name: site.name,
		legalName: site.legalName,
		url: site.url,
		image: image && new URL(image, site.url).href,
		description: 'Portrait photography in Prescott, Arizona: maternity, creative and themed portraits, milestones, headshots and couples.',
		priceRange: '$$',
		address: { '@type': 'PostalAddress', addressLocality: 'Prescott', addressRegion: 'AZ', addressCountry: 'US' },
		areaServed: site.serviceArea.map((name) => ({ '@type': 'City', name: `${name}, AZ` })),
		founder: { '@id': person['@id'] },
		sameAs: Object.values(site.social)
	};
}

export function faqPage(faqs: { q: string; a: string }[]) {
	return {
		'@type': 'FAQPage',
		mainEntity: faqs.map(({ q, a }) => ({
			'@type': 'Question',
			name: q,
			acceptedAnswer: { '@type': 'Answer', text: a }
		}))
	};
}
