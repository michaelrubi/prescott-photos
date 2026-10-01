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

The Book page posts each inquiry as a URL-encoded form (no CORS preflight) straight from the browser to an n8n webhook, set as `inquiryWebhook` in `src/lib/site.ts`. Fields: `name`, `email`, `type`, `package`, `dates`, `source`, `message`, `page`, `sentAt`. Any `2xx` response counts as sent. In n8n, the workflow must be active (the production `/webhook/` URL only works then), the Webhook node set to POST and respond immediately, and **Allowed Origins (CORS)** left at `*` or set to this site's origins so the browser can read the response.

Site copy that repeats across pages or changes often (packages, prices, policies, FAQs, locations) lives in `src/lib/content.ts`.

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
