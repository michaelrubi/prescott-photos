/**
 * Card payments through Stripe Checkout. The site has no server, so an n8n
 * workflow (`checkoutWebhook` in site.ts) holds the Stripe secret key: it
 * works out the amount itself (package prices from /pay/prices.json, extras
 * from the gallery in Firestore), creates a Checkout session and returns its
 * URL. The browser only says what is being paid for, never how much.
 *
 * Requests are URL-encoded form posts, like the booking form, so the browser
 * skips the CORS preflight.
 */
import { site } from './site.ts';

export type PaymentKind = 'retainer' | 'balance' | 'extras';

export const paymentsEnabled = Boolean(site.checkoutWebhook);

/** Dollar amounts for a gallery's extra images */
export interface ExtrasQuote {
	total: number;
	paid: number;
	due: number;
}

interface CheckoutFields {
	kind: PaymentKind;
	/** Package id, for a retainer or balance */
	package?: string;
	/** Gallery id, for extras */
	gallery?: string;
	name?: string;
	email?: string;
	/** Where Stripe sends the client back to, after paying or cancelling */
	success: string;
	cancel: string;
}

async function call<T>(fields: Record<string, string | undefined>): Promise<T> {
	const body = new URLSearchParams();
	for (const [key, value] of Object.entries(fields)) if (value) body.set(key, value);
	const response = await fetch(site.checkoutWebhook, { method: 'POST', body });
	const data = await response.json().catch(() => ({}));
	if (!response.ok || data.error) throw new Error(data.error ?? `Checkout webhook responded ${response.status}`);
	return data as T;
}

/**
 * Opens Stripe Checkout in this tab. Resolves with `paid: true` instead when
 * there's nothing left to pay (extras that were already paid for).
 */
export async function startCheckout(fields: CheckoutFields) {
	const { url } = await call<{ url?: string }>({ action: 'checkout', ...fields });
	if (!url) return { paid: true };
	location.assign(url);
	return { paid: false };
}

export function quoteExtras(gallery: string) {
	return call<ExtrasQuote>({ action: 'quote', kind: 'extras', gallery });
}

/** The current page's URL with `key=1` added to its query string, keeping the hash */
export function returnUrl(key: 'paid' | 'canceled') {
	const url = new URL(location.href);
	url.searchParams.delete('paid');
	url.searchParams.delete('canceled');
	url.searchParams.set(key, '1');
	return url.href;
}

/** Reads and removes `?paid` / `?canceled` after Stripe sends the client back */
export function takeReturnState() {
	const url = new URL(location.href);
	const state = url.searchParams.has('paid') ? 'paid' : url.searchParams.has('canceled') ? 'canceled' : undefined;
	if (state) {
		url.searchParams.delete('paid');
		url.searchParams.delete('canceled');
		history.replaceState(history.state, '', url);
	}
	return state;
}
