// Security rules for proofing galleries, run against the Firestore emulator:
//   pnpm test:rules
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
	collection,
	collectionGroup,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
	updateDoc
} from 'firebase/firestore';

const gid = 'AbCdEfGhIjKlMnOpQrSt';
let env;

const admin = () =>
	env.authenticatedContext('michael', { email: 'mrubi.studios@gmail.com', email_verified: true }).firestore();
const stranger = () =>
	env.authenticatedContext('someone', { email: 'someone@example.com', email_verified: true }).firestore();
const client = () => env.unauthenticatedContext().firestore();

const picks = (ids, submitted = false, extra = {}) => ({
	ids,
	note: '',
	submitted,
	updatedAt: serverTimestamp(),
	...(submitted && { submittedAt: serverTimestamp() }),
	...extra
});

async function seed(gallery = {}, existingPicks) {
	await env.withSecurityRulesDisabled(async (ctx) => {
		const db = ctx.firestore();
		await setDoc(doc(db, 'galleries', gid), {
			title: 'Test',
			client: 'Ava',
			message: '',
			included: 2,
			extraPrice: 0,
			open: true,
			photoCount: 4,
			...gallery
		});
		await setDoc(doc(db, 'galleries', gid, 'photos', 'p1'), { name: 'A.jpg', order: 0 });
		await setDoc(doc(db, 'galleries', gid, 'full', 'p1'), { data: 'x' });
		if (existingPicks) await setDoc(doc(db, 'picks', gid), existingPicks);
	});
}

before(async () => {
	env = await initializeTestEnvironment({
		projectId: 'demo-proofing',
		firestore: { rules: readFileSync('firestore.rules', 'utf8') }
	});
});
beforeEach(() => env.clearFirestore());
after(() => env.cleanup());

describe('viewing', () => {
	test('anyone with the id can read the gallery, photos and proofs', async () => {
		await seed();
		await assertSucceeds(getDoc(doc(client(), 'galleries', gid)));
		await assertSucceeds(getDocs(collection(client(), 'galleries', gid, 'photos')));
		await assertSucceeds(getDoc(doc(client(), 'galleries', gid, 'full', 'p1')));
		await assertSucceeds(getDoc(doc(client(), 'picks', gid)));
	});

	test('nobody but the admin can list galleries, proofs or picks', async () => {
		await seed();
		for (const db of [client(), stranger()]) {
			await assertFails(getDocs(collection(db, 'galleries')));
			await assertFails(getDocs(collection(db, 'galleries', gid, 'full')));
			await assertFails(getDocs(collection(db, 'picks')));
			await assertFails(getDocs(collectionGroup(db, 'photos')));
		}
		await assertSucceeds(getDocs(collection(admin(), 'galleries')));
		await assertSucceeds(getDocs(collection(admin(), 'picks')));
	});

	test('an unverified admin email is not an admin', async () => {
		await seed();
		const db = env
			.authenticatedContext('fake', { email: 'mrubi.studios@gmail.com', email_verified: false })
			.firestore();
		await assertFails(getDocs(collection(db, 'galleries')));
	});
});

describe('managing', () => {
	test('only the admin can create, change or delete galleries and photos', async () => {
		await seed();
		for (const db of [client(), stranger()]) {
			await assertFails(setDoc(doc(db, 'galleries', 'NewGalleryId00000000'), { title: 'x' }));
			await assertFails(updateDoc(doc(db, 'galleries', gid), { open: false }));
			await assertFails(setDoc(doc(db, 'galleries', gid, 'photos', 'p2'), { name: 'B.jpg' }));
			await assertFails(deleteDoc(doc(db, 'galleries', gid, 'full', 'p1')));
		}
		await assertSucceeds(updateDoc(doc(admin(), 'galleries', gid), { open: false }));
		await assertSucceeds(setDoc(doc(admin(), 'galleries', gid, 'photos', 'p2'), { name: 'B.jpg' }));
		await assertSucceeds(deleteDoc(doc(admin(), 'galleries', gid, 'full', 'p1')));
	});

	test('the admin can reopen submitted picks', async () => {
		await seed({}, { ids: ['p1'], note: '', submitted: true });
		await assertSucceeds(updateDoc(doc(admin(), 'picks', gid), { submitted: false, updatedAt: serverTimestamp() }));
	});
});

describe('picking', () => {
	test('a client can save and then submit picks', async () => {
		await seed();
		await assertSucceeds(setDoc(doc(client(), 'picks', gid), picks(['p1'])));
		await assertSucceeds(setDoc(doc(client(), 'picks', gid), picks(['p1', 'p2'], true)));
	});

	test('picks lock once submitted', async () => {
		await seed({}, { ids: ['p1'], note: '', submitted: true });
		await assertFails(setDoc(doc(client(), 'picks', gid), picks(['p2'])));
	});

	test('a closed gallery takes no picks', async () => {
		await seed({ open: false });
		await assertFails(setDoc(doc(client(), 'picks', gid), picks(['p1'])));
	});

	test('picks for a gallery that does not exist are refused', async () => {
		await assertFails(setDoc(doc(client(), 'picks', 'NoSuchGallery0000000'), picks(['p1'])));
	});

	test('without extras, picks stop at the package count', async () => {
		await seed({ included: 2, extraPrice: 0 });
		await assertFails(setDoc(doc(client(), 'picks', gid), picks(['p1', 'p2', 'p3'])));
	});

	test('with extras, picks can go past the package count up to every photo', async () => {
		await seed({ included: 2, extraPrice: 25, photoCount: 4 });
		await assertSucceeds(setDoc(doc(client(), 'picks', gid), picks(['p1', 'p2', 'p3'])));
		await assertFails(setDoc(doc(client(), 'picks', gid), picks(['p1', 'p2', 'p3', 'p4', 'p5'])));
	});

	test('picks must have the expected shape', async () => {
		await seed();
		const ref = doc(client(), 'picks', gid);
		await assertFails(setDoc(ref, picks(['p1'], false, { price: 0 })));
		await assertFails(setDoc(ref, picks(['p1'], false, { note: 'x'.repeat(2001) })));
		await assertFails(setDoc(ref, picks(['p1'], false, { updatedAt: new Date(0) })));
		await assertFails(setDoc(ref, picks([], true)));
		await assertFails(setDoc(ref, picks(['p1'], false, { submittedAt: serverTimestamp() })));
		await assertFails(setDoc(ref, { ...picks(['p1'], true), submittedAt: new Date(0) }));
	});

	test('a client cannot delete picks', async () => {
		await seed({}, { ids: ['p1'], note: '', submitted: false });
		await assertFails(deleteDoc(doc(client(), 'picks', gid)));
	});
});
