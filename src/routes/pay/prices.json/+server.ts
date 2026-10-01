import { packages, retainer } from '#lib/content.ts';

export const prerender = true;

/**
 * Package prices in dollars, read by the n8n checkout workflow so the amounts
 * clients pay always match what the site shows. See #lib/payments.ts.
 */
export function GET() {
	const body = {
		retainer,
		packages: Object.fromEntries(packages.map((p) => [p.id, { name: p.name, price: p.price }]))
	};
	return new Response(JSON.stringify(body, null, '\t'), { headers: { 'Content-Type': 'application/json' } });
}
