# prescottphotos.com

Portfolio and booking site for Michael Rubi Photography, Prescott, Arizona.

Built with SvelteKit 3 (release candidate), Svelte 5, vanilla CSS and GSAP. Every page is pre-rendered by `@sveltejs/adapter-static` and served from Firebase Hosting.

## Develop

Requires Node 22.17 or newer.

```sh
npm install
npm run dev      # local dev server
npm run check    # type-check
npm run build    # static site in ./build
npm run preview  # serve the production build
```

Imports from `src/lib` use Node subpath imports: `import { site } from '#lib/site.ts'` (SvelteKit 3 replaced `$lib` with `#lib`).

## Deploy

GitHub Actions (`.github/workflows/ci.yml`) type-checks and builds every push and pull request.

- Pull requests deploy to a temporary Firebase preview channel and get a comment with the preview link.
- Merges to `main` deploy to the live site.

One-time setup in the GitHub repo settings:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `FIREBASE_PROJECT_ID` | The Firebase project id |
| Secret | `FIREBASE_SERVICE_ACCOUNT` | JSON key for a service account with the Firebase Hosting Admin role |

Running `npx firebase-tools init hosting:github` creates the service account and secret for you. Until the variable is set, CI only builds.

Old URLs from the previous site (`/portfolio`, `/pricing`, `/contact`) redirect in `firebase.json`.

## Mirror

GitHub is the source of truth. A Forgejo pull mirror keeps a backup copy.
