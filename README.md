# prescottphotos.com

Portfolio and booking site for Michael Rubi Photography, Prescott, Arizona.

Built with SvelteKit 3 (release candidate), Svelte 5, vanilla CSS and GSAP. Every page is pre-rendered by `@sveltejs/adapter-static` and served from Firebase Hosting.

## Develop

Requires Node 22.17 or newer and pnpm (the version is pinned in `package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm dev      # local dev server
pnpm check    # type-check
pnpm build    # static site in ./build
pnpm preview  # serve the production build
```

Imports from `src/lib` use Node subpath imports: `import { site } from '#lib/site.ts'` (SvelteKit 3 replaced `$lib` with `#lib`).

## Deploy

GitHub Actions (`.github/workflows/ci.yml`) type-checks and builds every push and pull request.

- Pull requests deploy to a temporary Firebase preview channel and get a comment with the preview link.
- Every merge to `main` updates the `staging` preview channel, a stable URL for the latest build.
- Live deploys are manual until launch: run the CI workflow on `main` from the Actions tab ("Run workflow"). After launch this switches back to deploying every merge to `main`.

The Firebase project is `rubi-photo`. CI authenticates with the `FIREBASE_SERVICE_ACCOUNT_RUBI_PHOTO` repository secret, created by `firebase init hosting:github`.

Old URLs from the previous site (`/portfolio`, `/pricing`, `/contact`) redirect in `firebase.json`.

### Booking form

The Book page posts each inquiry as a URL-encoded form (no CORS preflight) straight from the browser to an n8n webhook, set as `inquiryWebhook` in `src/lib/site.ts`. Fields: `name`, `email`, `type`, `package`, `dates` (ISO `YYYY-MM-DD`, comma-separated), `time`, `source`, `message`, `page`, `sentAt`. Any `2xx` response counts as sent. In n8n, the workflow must be active (the production `/webhook/` URL only works then), the Webhook node set to POST and respond immediately, and **Allowed Origins (CORS)** left at `*` or set to this site's origins so the browser can read the response.

Site copy that repeats across pages or changes often (packages, prices, policies, FAQs, locations) lives in `src/lib/content.ts`.

## Payments

Clients pay by card through [Stripe Checkout](https://docs.stripe.com/payments/checkout). The site has no server, so the n8n **Stripe checkout** workflow (`checkoutWebhook` in `src/lib/site.ts`) holds the Stripe secret key. The browser only says what is being paid for; n8n works out the amount itself, creates a Checkout session and returns its URL (`src/lib/payments.ts`).

- **Retainer, balance or in full:** `prescottphotos.com/pay`. Send a client `/pay?package=signature&for=retainer` once their date is set, and `&for=balance` before delivery, or `&for=full` to pay it all at once. Prices come from `packages` and `retainer` in `src/lib/content.ts`, published as `/pay/prices.json` for n8n to read. The balance (and a full payment) is the package price less whatever Stripe already received from that email for that package, so a client who skipped the retainer pays the full price and nobody pays twice. No database is involved: Stripe's own payment records are the ledger, so the client must use the same email both times.
- **Extra images:** once a client sends picks with more than their package includes, the gallery shows a "Pay by card" button for the extras. n8n counts the picks and reads the per-image price from Firestore, and subtracts anything Stripe already received for that gallery, so reopening a gallery and adding more only charges the difference.
- **Prints** stay in the Pixieset store, not Stripe.

The n8n **Stripe payment → email** workflow emails Michael when a checkout completes. Stripe emails the client a receipt (live mode: Stripe Dashboard → Settings → Customer emails → Successful payments).

Requests to `checkoutWebhook` are URL-encoded form posts (no CORS preflight) with `action` (`checkout` or `quote`), `kind` (`retainer`, `balance`, `full` or `extras`), `package` or `gallery`, optional `name` and `email`, and the `success` and `cancel` pages to return to (this site's origins only). `checkout` answers `{ url }`, or `{ total, paid, due }` when nothing is owed; `quote` answers `{ total, paid, due }` for a gallery's extras.

To switch from test to live payments, put the live secret key in the n8n Stripe credential. Nothing in the site changes.

## Mirror

GitHub is the source of truth. A Forgejo pull mirror keeps a backup copy.

## Photos

Photos live in `photos/<category>/` (`portraits`, `couples`, `families`) as high-quality JPGs, about 2560px on the long edge. Each folder has a `photos.json` with alt text per file:

```json
{
	"watson-lake-golden-hour.jpg": { "alt": "Woman in a white dress at sunset on the granite dells at Watson Lake" }
}
```

At build time every photo is resized to several widths in AVIF and WebP (metadata, including GPS, is stripped), given a tiny ThumbHash blur placeholder, and its lens, aperture, shutter and ISO are read for the captions. The `sample-*.jpg` files are generated placeholders (`node scripts/make-sample-photos.js`); delete them once real photos are in.

## Proofing galleries

Private galleries where a client picks their favorite shots from a culled session, instead of Michael choosing for them.

- **Client:** `prescottphotos.com/g#<gallery id>`. They heart photos (a counter tracks their package's image count), open any photo full screen (P picks it there), and send their picks with an optional note. Picks save as they go, so they can come back on another device. Sending locks the picks until Michael reopens them.
- **Michael:** `prescottphotos.com/g/admin`, signed in with Google. Create a gallery (title, client name, images included, optional per-image price for extras, a note), drop in the culled exports, copy the link. Picks appear live, with buttons to copy the file names for Lightroom's filename filter.

Everything runs in the browser against Firestore (`src/lib/proofing/`); there's no server code. Uploads are resized in the browser to a 1600px proof and a 640px thumbnail, with all metadata removed, and stored as bytes in Firestore documents, because Cloud Storage needs the pay-as-you-go plan. The free plan's 1 GB of Firestore storage holds roughly 30 galleries of 80 photos, so delete galleries after delivery.

The gallery id (20 random characters, in the URL hash so it never reaches a server log) is the key: anyone with the link can view and pick. Nobody can list galleries, and only the Google accounts in `firestore.rules` can create or change them.

When a client sends picks, the page posts them (URL-encoded, like the booking form) to `picksWebhook` in `src/lib/site.ts`, if set. Fields: `gallery`, `client`, `count`, `included`, `extras`, `extraTotal`, `note`, `files` (Lightroom list), `admin` (link to the gallery's admin page), `sentAt`.

### One-time Firebase setup

1. **Firestore:** Firebase console → Build → Firestore Database → Create database. Use the `(default)` database, Standard edition, a US location (`us-west2` is closest; it can't be changed later), and production mode.
2. **Google sign-in:** Build → Authentication → Get started → Sign-in method → Google → Enable. Under Settings → Authorized domains, add `prescottphotos.com` (and the staging channel's domain to test there).
3. **Web app:** Project settings → General → Your apps → Add app → Web, and link it to the Hosting site. The site reads its config from Hosting's `/__/firebase/init.json`, so nothing needs to be pasted into the code.
4. **Rules and indexes:** from this repo, `firebase deploy --only firestore` (needs the Firebase CLI signed in to the project). CI deploys Hosting only.

### Local development

`pnpm dev:proofing` runs the site against local Firestore and Auth emulators (needs the Firebase CLI and Java 21+); the admin's sign-in button signs in as the studio account without Google. `pnpm test:rules` tests `firestore.rules` against the emulator. Plain `pnpm dev` uses the real project through the dev server's proxy.

Photos appear in the order they're listed in `photos.json`. Two optional keys: `"hero": true` picks the home page's full-screen photo (and the default share image), and `"focus": "48% 50%"` sets which part stays in frame when a photo is cropped. A category folder with no photos is hidden from the portfolio filter.

Your own photo for the About page goes in `photos/about/` as a JPG (any name). It's shown in a 4:5 portrait crop and used as that page's share image, and it never appears in the portfolio.

Camera settings (focal length, aperture, shutter, ISO) are read from each JPG's EXIF automatically. If an export stripped them, add them by hand with a `capture` key, which also overrides any single EXIF value:

```json
"MJR09665.jpg": {
  "alt": "…",
  "capture": { "lens": "85mm", "aperture": "f/1.8", "shutter": "1/500", "iso": 100 }
}
```

At build time every photo is resized to several widths in AVIF and WebP (metadata, including GPS, is stripped), given a tiny ThumbHash blur placeholder, and its lens, aperture, shutter and ISO are read for the captions. `node scripts/make-sample-photos.js` generates placeholder images for testing.
