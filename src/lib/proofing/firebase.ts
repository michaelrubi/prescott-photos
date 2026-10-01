/**
 * Firebase for the proofing galleries, loaded only on /g pages.
 *
 * The web app config comes from Firebase Hosting's reserved
 * `/__/firebase/init.json`, so nothing is committed to the repo and preview
 * channels get the same config as the live site. `vite dev` proxies that URL
 * to the deployed site.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
	connectFirestoreEmulator,
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
	type Firestore
} from 'firebase/firestore';

export class NotConfiguredError extends Error {
	constructor() {
		super('Firebase is not set up for this site yet');
	}
}

/** `pnpm dev:proofing` runs the site against local Firestore and Auth emulators */
export const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === 'true';
const emulatorConfig = { projectId: 'demo-proofing', apiKey: 'demo', authDomain: 'localhost' };

const ready = new Map<string, Promise<{ app: FirebaseApp; db: Firestore }>>();

async function loadConfig() {
	if (useEmulators) return emulatorConfig;
	const response = await fetch('/__/firebase/init.json');
	if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
		throw new NotConfiguredError();
	}
	return response.json();
}

/**
 * The client gallery and the admin page use separate Firebase apps, so each
 * has its own sign-in state and offline cache. Otherwise a gallery previewed
 * while signed in to the admin would share the admin's session, and Firestore's
 * multi-tab cache would hold the client's (signed-out) writes back.
 */
export function firebase(name: 'gallery' | 'admin') {
	let app = ready.get(name);
	if (app) return app;
	app = loadConfig().then((config) => {
		const app = initializeApp(config, name);
		// Proof images never change once uploaded, so keep what's been
		// downloaded in IndexedDB and serve repeat views from there.
		const db = initializeFirestore(app, {
			localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
		});
		if (useEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080);
		return { app, db };
	});
	app.catch(() => ready.delete(name));
	ready.set(name, app);
	return app;
}
