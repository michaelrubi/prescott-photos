# Prescott Photo

Portfolio, booking and client site for **Prescott Photo**, portraits by Michael Rubi in Prescott, Arizona (Rubiconetic LLC dba Prescott Photo).

- **Live:** https://prescottphoto.com (`prescottphotos.com` redirects here)
- **Staging:** the latest `main`, linked from this repo's Environments panel → `staging`
- **Previews:** every pull request gets its own link in a bot comment

Visitors browse the portfolio, read about sessions and send an inquiry. Clients pick their favorites in a private proofing gallery and pay by card. Michael manages galleries from `/g/admin`.

## How it's built

A static SvelteKit 3 site (release candidate) with Svelte 5, vanilla CSS and GSAP, prerendered by `@sveltejs/adapter-static` and served from Firebase Hosting on the free plan. There's no server code:

- **Booking inquiries** post from the browser to an n8n webhook, which saves and emails them.
- **Proofing galleries** read and write Firestore directly, guarded by `firestore.rules`.
- **Payments** go through Stripe Checkout; an n8n workflow holds the Stripe key and prices every charge.

[docs/decisions.md](docs/decisions.md) explains why each piece was chosen. [docs/integrations.md](docs/integrations.md) has the webhook fields, payment flow and Firebase setup.

## Getting started

Requires Node 22.17 or newer and pnpm (the version is pinned in `package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm dev            # dev server at http://localhost:5173
pnpm check          # type-check (CI runs this)
pnpm build          # static site in ./build (CI runs this)
pnpm preview        # serve the production build
pnpm dev:proofing   # dev server against local Firestore/Auth emulators (Firebase CLI + Java 21+)
pnpm test:rules     # test firestore.rules against the emulator
```

Imports from `src/lib` use Node subpath imports with the file extension: `import { site } from '#lib/site.ts'`. SvelteKit 3 replaced `$lib` with `#lib`, and its config lives in `vite.config.ts`.

## Where things are

```
photos/<category>/     portfolio JPGs + photos.json (alt text, order, options)
photos/about/          Michael's photo for the About page
src/lib/site.ts        name, domain, social links, n8n webhook URLs
src/lib/content.ts     packages, prices, retainer, policies, FAQs, locations
src/lib/styles/        design tokens and base styles
src/lib/components/    shared UI (Frame, Gallery, Seo, AfCursor, Logo, ...)
src/lib/motion/        GSAP loader and scroll reveals
src/lib/proofing/      proofing galleries (Firestore, resizing, viewer)
src/lib/payments.ts    talks to the Stripe checkout webhook
src/routes/            pages; /g is the client gallery, /g/admin the admin, /pay the payment page
brand/                 logo files and the generator that builds them
firestore.rules        who can read and write galleries; admin accounts
firebase.json          Hosting config, redirects from the old site's URLs, headers
```

`/style` is the design preview page used to approve the look; it isn't linked or indexed.

## Common tasks

### Add or change portfolio photos

Put high-quality JPGs, about 2560px on the long edge, in `photos/portraits/`, `photos/couples/` or `photos/families/`, and give each one alt text in that folder's `photos.json`:

```json
{
	"watson-lake-golden-hour.jpg": { "alt": "Woman in a white dress at sunset on the granite dells at Watson Lake" }
}
```

- Photos appear in the order they're listed in `photos.json`.
- `"hero": true` picks the home page's full-screen photo and the default share image.
- `"focus": "48% 50%"` sets which part stays in frame when a photo is cropped.
- `"capture": { "lens": "85mm", "aperture": "f/1.8", "shutter": "1/500", "iso": 100 }` fills in camera settings for an export whose EXIF was stripped (or overrides one value).
- A category folder with no photos is hidden from the portfolio filter.

At build time every photo is resized to several widths in AVIF and WebP with metadata (including GPS) stripped, gets a tiny ThumbHash blur placeholder, and has its lens, aperture, shutter and ISO read from EXIF for the captions. `node scripts/make-sample-photos.js` generates placeholder images for testing.

For the About page, put one JPG in `photos/about/` (any name). It's shown in a 4:5 crop, used as that page's share image, and never appears in the portfolio.

### Change prices, packages or policies

Edit `src/lib/content.ts`. The Sessions page, FAQs, structured data and `/pay/prices.json` (which n8n reads to price charges) all update from it, so the page and the charge always agree. Keep each package's `id` stable: it's in payment links clients already have.

### Ask a client to pay

Send them `https://prescottphoto.com/pay?package=<id>&for=retainer` once their date is set, then `&for=balance` before delivery (or `&for=full` for everything at once). Package ids are `essential`, `signature` and `full-story`. The client must use the same email each time. Details in [docs/integrations.md](docs/integrations.md#payments).

### Run a proofing gallery

At `/g/admin`, sign in with an admin Google account, create a gallery, drop in the culled exports and send the client the link. Picks show up live, with buttons to copy file names into Lightroom's filename filter. Delete galleries after delivery to stay within the free Firestore storage.

To add an admin, add the email to `firestore.rules` and run `firebase deploy --only firestore:rules` after merging; CI doesn't deploy rules.

### Change the logo

`brand/` holds the finished files: the Thumb Butte mark (dark, light, black and white), lockups and stacked versions for "Prescott Photo", "Prescott Photos" and "Michael Rubi", and the favicon. They're plain filled paths, so they open the same in Figma, Canva, Lightroom or at a print shop.

`brand/generator/build.py` builds all of them from `brand/generator/skyline.txt` (the butte's outline, traced from a photo), and also writes `static/favicon.svg` and `src/lib/brand/mark.ts` (the paths `Logo.svelte` draws). To change the logo, edit the generator and run it from the repo root:

```sh
python3 -m pip install fonttools brotli uharfbuzz skia-pathops
python3 brand/generator/build.py
```

The name and tagline next to the logo in the header are `brand` in `src/lib/site.ts`. `static/apple-touch-icon.png` is a 180px render of `brand/icon.svg`; re-export it if the icon changes.

## Deploying

GitHub Actions (`.github/workflows/ci.yml`) type-checks and builds every push and pull request, then:

- **Pull requests** deploy to a temporary Firebase preview channel (14 days) and get a comment with the link.
- **Merges to `main`** update the `staging` channel.
- **The live site** deploys only when the workflow is run by hand: Actions → CI → Run workflow on `main`. To roll back, use Firebase console → Hosting → Release history.

Firestore rules and indexes aren't deployed by CI; run `firebase deploy --only firestore` when they change.

## Configuration and secrets

Nothing secret is in this repo. The names to know:

| What | Where |
| --- | --- |
| Firebase project | `rubi-photo` (`.firebaserc`) |
| CI deploy credential | GitHub repo secret `FIREBASE_SERVICE_ACCOUNT_RUBI_PHOTO`, created by `firebase init hosting:github` |
| Firebase web config | served by Hosting at `/__/firebase/init.json`; nothing to set |
| Gallery admin accounts | `firestore.rules` |
| n8n webhook URLs | `inquiryWebhook`, `picksWebhook`, `checkoutWebhook` in `src/lib/site.ts` (public by design; the browser calls them) |
| Stripe secret key | n8n credential "Stripe", never in this repo. Test mode until the live key goes in there. |

## Mirror

GitHub is the source of truth. A Forgejo pull mirror keeps a backup copy.
