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
- Live deploys are manual until launch: run the CI workflow on `main` from the Actions tab ("Run workflow"). After launch this switches back to deploying every merge to `main`.

One-time setup in the GitHub repo settings:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `FIREBASE_PROJECT_ID` | The Firebase project id |
| Secret | `FIREBASE_SERVICE_ACCOUNT` | JSON key for a service account with the Firebase Hosting Admin role |

Running `pnpm dlx firebase-tools init hosting:github` creates the service account and secret for you. Until the variable is set, CI only builds.

Old URLs from the previous site (`/portfolio`, `/pricing`, `/contact`) redirect in `firebase.json`.

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
