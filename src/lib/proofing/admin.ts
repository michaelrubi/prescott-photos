/** Gallery management for Michael's admin page. Every write here needs an admin sign-in (firestore.rules). */
import {
	Bytes,
	collection,
	deleteDoc,
	doc,
	getDocs,
	increment,
	serverTimestamp,
	setDoc,
	updateDoc,
	writeBatch,
	type Firestore
} from 'firebase/firestore';
import type { Gallery } from './gallery.ts';
import { prepare } from './resize.ts';

export type GalleryFields = Pick<Gallery, 'title' | 'client' | 'message' | 'included' | 'extraPrice'>;

export async function createGallery(db: Firestore, fields: GalleryFields) {
	// Firestore's auto ids are 20 random characters: the link is the key
	const ref = doc(collection(db, 'galleries'));
	await setDoc(ref, { ...fields, open: true, photoCount: 0, createdAt: serverTimestamp() });
	return ref.id;
}

export function updateGallery(db: Firestore, gid: string, fields: Partial<GalleryFields & { open: boolean }>) {
	return updateDoc(doc(db, 'galleries', gid), fields);
}

export interface UploadProgress {
	done: number;
	total: number;
	failed: string[];
}

/**
 * Resizes and uploads photos, three at a time, in file-name order (the order
 * Lightroom exports them). Each photo, its proof and the gallery's count are
 * written together, so a photo never shows up without its proof.
 */
export async function uploadPhotos(
	db: Firestore,
	gid: string,
	files: File[],
	startOrder: number,
	onProgress: (progress: UploadProgress) => void
) {
	const queue = [...files]
		.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
		.map((file, i) => ({ file, order: startOrder + i }));
	const progress: UploadProgress = { done: 0, total: queue.length, failed: [] };
	onProgress({ ...progress });

	async function worker() {
		for (let item = queue.shift(); item; item = queue.shift()) {
			try {
				const image = await prepare(item.file);
				const photo = doc(collection(db, 'galleries', gid, 'photos'));
				const batch = writeBatch(db);
				batch.set(doc(db, 'galleries', gid, 'full', photo.id), { data: Bytes.fromUint8Array(image.full) });
				batch.set(photo, {
					name: item.file.name,
					order: item.order,
					width: image.width,
					height: image.height,
					thumb: Bytes.fromUint8Array(image.thumb)
				});
				batch.update(doc(db, 'galleries', gid), { photoCount: increment(1) });
				await batch.commit();
			} catch (error) {
				console.error(item.file.name, error);
				progress.failed.push(item.file.name);
			}
			progress.done++;
			onProgress({ ...progress, failed: [...progress.failed] });
		}
	}

	await Promise.all([worker(), worker(), worker()]);
	return progress;
}

export async function deletePhoto(db: Firestore, gid: string, pid: string) {
	const batch = writeBatch(db);
	batch.delete(doc(db, 'galleries', gid, 'photos', pid));
	batch.delete(doc(db, 'galleries', gid, 'full', pid));
	batch.update(doc(db, 'galleries', gid), { photoCount: increment(-1) });
	await batch.commit();
}

/** Lets the client change their picks again after submitting */
export function reopenPicks(db: Firestore, gid: string) {
	return updateDoc(doc(db, 'picks', gid), { submitted: false, updatedAt: serverTimestamp() });
}

/** Deletes a gallery with all its photos and picks, freeing up the free-plan storage */
export async function deleteGallery(db: Firestore, gid: string) {
	// Proofs share their photo's id, so listing the small photo docs is enough
	// (listing `full` would download every proof just to delete it)
	const photos = await getDocs(collection(db, 'galleries', gid, 'photos'));
	for (let i = 0; i < photos.docs.length; i += 200) {
		// A batch holds at most 500 writes
		const batch = writeBatch(db);
		for (const d of photos.docs.slice(i, i + 200)) {
			batch.delete(d.ref);
			batch.delete(doc(db, 'galleries', gid, 'full', d.id));
		}
		await batch.commit();
	}
	await deleteDoc(doc(db, 'picks', gid));
	await deleteDoc(doc(db, 'galleries', gid));
}
