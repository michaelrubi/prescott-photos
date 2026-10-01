import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Set once with `firebase functions:secrets:set <NAME>` (deploy prompts if missing)
const resendKey = defineSecret('RESEND_API_KEY');
const inbox = defineSecret('INQUIRY_EMAIL');

const limits = { name: 100, email: 200, type: 40, package: 40, dates: 200, source: 40, message: 5000 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Receives the booking form (served at /api/inquiry through a Hosting rewrite)
 * and emails it to Michael through Resend, with Reply-To set to the client.
 */
export const inquiry = onRequest(
	{ region: 'us-central1', secrets: [resendKey, inbox], maxInstances: 2, memory: '256MiB' },
	async (req, res) => {
		if (req.method !== 'POST') {
			res.set('Allow', 'POST').status(405).json({ success: false, message: 'Method not allowed' });
			return;
		}

		const body = typeof req.body === 'object' && req.body ? req.body : {};
		// Honeypot: real visitors never see this field
		if (body.botcheck) {
			res.json({ success: true });
			return;
		}

		const fields = {};
		for (const [key, max] of Object.entries(limits)) {
			fields[key] = String(body[key] ?? '').trim().slice(0, max);
		}
		if (!fields.name || !emailPattern.test(fields.email) || !fields.message) {
			res.status(400).json({ success: false, message: 'Name, a valid email and a message are required.' });
			return;
		}

		const text = [
			`Name: ${fields.name}`,
			`Email: ${fields.email}`,
			`Session: ${fields.type || 'not given'}`,
			`Package: ${fields.package || 'not sure yet'}`,
			`Dates: ${fields.dates || 'not given'}`,
			`Found you through: ${fields.source || 'not given'}`,
			'',
			fields.message
		].join('\n');

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${resendKey.value()}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				// resend.dev works without verifying a domain, as long as it sends to
				// the Resend account's own address. Switch to @prescottphotos.com once verified.
				from: 'prescottphotos.com <onboarding@resend.dev>',
				to: [inbox.value()],
				reply_to: fields.email,
				subject: `New ${(fields.type || 'session').toLowerCase()} inquiry from ${fields.name}`,
				text
			})
		});

		if (!response.ok) {
			logger.error('Resend rejected the inquiry email', { status: response.status, body: await response.text() });
			res.status(502).json({ success: false, message: 'Could not send right now.' });
			return;
		}
		res.json({ success: true });
	}
);
