/**
 * Proofing galleries in Firestore. The data model, shared by the client
 * gallery page and the admin page (rules: firestore.rules):
 *
 *   galleries/{gid}             Gallery (gid is a random id; the link is the key)
 *   galleries/{gid}/photos/{pid} name, size, order and a small JPEG thumbnail
 *   galleries/{gid}/full/{pid}   the 1600px proof, fetched when a photo is opened
 *   picks/{gid}                  the client's picks, written by the client
 *
 * Images are stored as Firestore bytes rather than in Cloud Storage because
 * Storage needs the pay-as-you-go plan.
 */
import {
	collection,
	doc,
	getDoc,
	getDocFromCache,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	type Bytes,
	type Firestore,
	type Timestamp
} from 'firebase/firestore';

export interface Gallery {
	id: string;
	/** Shown as the page heading, e.g. "Ava · Maternity at Watson Lake" */
	title: string;
	/** Client's first name, used in the greeting */
	client: string;
	/** A note from Michael shown above the photos */
	message: string;
	/** Images included in the package */
	included: number;
	/** Price of each image beyond `included`, in dollars. 0 means no extras. */
	extraPrice: number;
	/** False locks the gallery: the client can look but not change picks */
	open: boolean;
	photoCount: number;
	createdAt?: Timestamp;
}

export interface ProofPhoto {
	id: string;
	/** Original file name, so picks can be matched in Lightroom */
	name: string;
	order: number;
	width: number;
	height: number;
	thumb: Bytes;
}

export interface Picks {
	ids: string[];
	note: string;
	submitted: boolean;
	updatedAt?: Timestamp;
	submittedAt?: Timestamp;
}

export const emptyPicks: Picks = { ids: [], note: '', submitted: false };

export async function loadGallery(db: Firestore, gid: string) {
	const snap = await getDoc(doc(db, 'galleries', gid));
	return snap.exists() ? ({ ...snap.data(), id: snap.id } as Gallery) : undefined;
}

export async function loadPhotos(db: Firestore, gid: string) {
	const snap = await getDocs(query(collection(db, 'galleries', gid, 'photos'), orderBy('order')));
	return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as ProofPhoto);
}

export async function loadPicks(db: Firestore, gid: string) {
	const snap = await getDoc(doc(db, 'picks', gid));
	return snap.exists() ? ({ ...emptyPicks, ...snap.data() } as Picks) : { ...emptyPicks };
}

/** Saves the client's picks. Submitting locks them until Michael reopens them. */
export function savePicks(db: Firestore, gid: string, picks: Pick<Picks, 'ids' | 'note' | 'submitted'>) {
	return setDoc(doc(db, 'picks', gid), {
		ids: picks.ids,
		note: picks.note,
		submitted: picks.submitted,
		updatedAt: serverTimestamp(),
		...(picks.submitted && { submittedAt: serverTimestamp() })
	});
}

export const bytesUrl = (bytes: Bytes) =>
	URL.createObjectURL(new Blob([bytes.toUint8Array() as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }));

/** Object URLs for full-size proofs, fetched once each and kept for the page's lifetime */
export function fullImages(db: Firestore, gid: string) {
	const urls = new Map<string, Promise<string>>();

	async function fetchFull(pid: string) {
		const ref = doc(db, 'galleries', gid, 'full', pid);
		const snap = await getDocFromCache(ref).catch(() => getDoc(ref));
		const data = snap.get('data') as Bytes | undefined;
		if (!data) throw new Error(`Missing proof ${pid}`);
		return bytesUrl(data);
	}

	return {
		get(pid: string) {
			let url = urls.get(pid);
			if (!url) {
				url = fetchFull(pid);
				url.catch(() => urls.delete(pid));
				urls.set(pid, url);
			}
			return url;
		}
	};
}
