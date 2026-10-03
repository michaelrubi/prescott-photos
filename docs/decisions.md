# Decisions

Why the site is built the way it is. Each entry is what was decided, why, and what was considered and turned down, with the pull request where it landed. Dates are when the decision was made or merged (UTC). Newer entries can supersede older ones; when that happens the older entry says so.

Open questions and unconfirmed content are listed at the end.

## Scope and direction

### Rebuild from scratch, portfolio first (2026-10-01)

**Decision:** Rebuild the old michaelrubiphotography.com instead of patching it. The new site leads with the portfolio, focuses on solo portraits (couples and families still welcome), and sells digital packages with prints as an optional add-on. The phone number is removed entirely; inquiries come through the booking form.

**Why:** The old site's source was lost, so there was nothing to patch. A review of the live site found the same title and description on every page, no share images, canonical URLs or structured data, an uncategorized portfolio, and pricing built around in-person sales (keepsake boxes, albums, wall art) that Michael was moving away from.

**Rejected:** Recreating the old page structure ("Start Here", "Pricing", "Contact") one to one. Old URLs redirect to their new equivalents instead.

### Stack: SvelteKit 3 release candidate, Svelte 5, vanilla CSS, GSAP (2026-10-01)

**Decision:** Build on SvelteKit 3 (`3.0.0-next`) with Svelte 5 runes, plain CSS with design tokens (`src/lib/styles/tokens.css`), and GSAP for motion.

**Why:** The old site was already SvelteKit, so the framework was familiar. SvelteKit 3 was in release candidate when work started, and Michael chose the RC over SvelteKit 2, which avoids a major-version upgrade shortly after launch. Plain CSS keeps the look hand-made rather than recognizably Tailwind or a UI kit, and keeps the bundle small. GSAP (ScrollTrigger, Flip) handles the motion that CSS alone can't, and is loaded lazily.

**Rejected:** SvelteKit 2 (stable at the time; would need upgrading soon). Tailwind or a component library, which tend toward the generic look Michael wanted to avoid.

**Consequences:** SvelteKit 3 replaced `$lib` with Node subpath imports, so code imports `#lib/...` with the `.ts` extension, and config lives in `vite.config.ts`. `pnpm-workspace.yaml` exempts the SvelteKit prerelease from pnpm's minimum release age.

### pnpm (2026-10-01, [#2](https://github.com/michaelrubi/prescott-photos/pull/2))

**Decision:** pnpm, version pinned in `package.json` (`packageManager`), with `engineStrict` on.

**Why:** Michael's preference. Pinning means local machines (`corepack enable`) and CI (`pnpm/action-setup`) run the same version.

**Rejected:** npm, which the scaffold started with.

### Fully static site, no server code (2026-10-01)

**Decision:** Every page is prerendered by `@sveltejs/adapter-static`. Anything dynamic runs in the browser and talks either to Firestore directly (proofing galleries) or to Michael's self-hosted n8n (booking inquiries, pick notifications, payments).

**Why:** It keeps Firebase on the free Spark plan. Cloud Functions and Cloud Storage both need the pay-as-you-go Blaze plan with a card on file. Michael already runs n8n, which can hold secrets, send email and call Stripe, so it fills the role a backend would.

**Rejected:** Firebase Cloud Functions (needs Blaze; tried for the booking form and removed, see below).

## Hosting and deployment

### Stay on Firebase Hosting, project `rubi-photo` (2026-10-01, [#4](https://github.com/michaelrubi/prescott-photos/pull/4))

**Decision:** Keep hosting on the Firebase project that served the old site.

**Why:** The domains were already connected there, it's free at this traffic, and preview channels give every pull request its own URL. Michael's condition was that CI/CD could run from GitHub or his Forgejo, which it can.

**Rejected:** Cloudflare Pages, the fallback if Firebase deploys from CI hadn't worked.

### GitHub is the source of truth, Forgejo mirrors it (2026-10-01)

**Decision:** The repo lives at `github.com/michaelrubi/prescott-photos` and CI runs on GitHub Actions. Michael keeps a pull mirror on his self-hosted Forgejo as a backup.

**Why:** Firebase's GitHub integration (`firebase init hosting:github`) sets up the service account secret and preview comments with no extra work.

### Preview, staging and manual live deploys (2026-10-01, [#3](https://github.com/michaelrubi/prescott-photos/pull/3), [#6](https://github.com/michaelrubi/prescott-photos/pull/6), [#8](https://github.com/michaelrubi/prescott-photos/pull/8))

**Decision:** Three deploy targets in `.github/workflows/ci.yml`:

- each pull request deploys to a 14-day preview channel and gets a comment with the link;
- each merge to `main` deploys to the `staging` channel, a stable URL shown under the repo's Environments panel;
- the live site deploys only when someone runs the workflow by hand on `main`.

**Why:** Until launch, the Firebase project was still serving the old site, so an automatic live deploy would have replaced it with an unfinished one. Preview links on every PR let Michael review changes on his phone before merging.

**Status:** The site launched on 2026-10-01 from a manual run. Live deploys are still manual: switching to deploy-on-merge is waiting on Michael's go-ahead.

## Look and feel

### The "viewfinder" design (2026-10-01, [#1](https://github.com/michaelrubi/prescott-photos/pull/1))

**Decision:** A dark, camera-inspired look: near-black background, Geist and Geist Mono (self-hosted), an Arizona-sunset amber accent, autofocus corner brackets around photos, and capture data (lens, aperture, shutter, ISO) shown like a camera's readout.

**Why:** Michael asked for something modern and "tech" that stands out but stays easy to navigate. The dark ground keeps attention on the photos, and the camera vocabulary ties the interface to the work. He approved it from the `/style` preview page, which is still in the repo (noindex).

### Camera-themed motion (2026-10-01, [#7](https://github.com/michaelrubi/prescott-photos/pull/7))

**Decision:** An autofocus-reticle cursor that locks onto photos, a shutter-and-viewfinder home hero, text that pulls into focus on scroll, a sideways film-strip reel, focus-pull and Flip transitions in the portfolio, a frame counter, defocus page transitions (View Transitions API) and a light film grain.

**Why:** After the first pages, Michael said the site felt basic and "vibe coded". The motion makes it feel like using a camera, which a template can't copy.

**Guardrails:** All of it switches off for visitors who prefer reduced motion. Touch devices get a native swipe strip and no custom cursor. GSAP loads lazily through `src/lib/motion/gsap.ts`.

### Thumb Butte logo (2026-10-01, [#17](https://github.com/michaelrubi/prescott-photos/pull/17))

**Decision:** The logo is Thumb Butte as seen looking west down Gurley Street, against a sunset sky inside the site's AF brackets. The outline is traced from a photo, and `brand/generator/build.py` generates every logo file, the favicon and the paths `Logo.svelte` draws.

**Why:** A Prescott landmark instead of a generic camera icon, and the brackets tie it to the site's look. Generated, plain filled paths open the same in Figma, Canva, Lightroom or at a print shop, and one script keeps every variant in sync.

### Rebrand to Prescott Photo (2026-10-02, [#19](https://github.com/michaelrubi/prescott-photos/pull/19))

**Decision:** The outward name is **Prescott Photo** ("Portraits by Michael Rubi"), operating as Rubiconetic LLC dba Prescott Photo. `https://prescottphoto.com` is the canonical domain and `prescottphotos.com` 301-redirects to it.

**Why:** Michael's call. Keeping his name in the tagline, structured data (as founder) and About page preserves word-of-mouth and the personal connection.

**Supersedes:** The earlier plan of "Michael Rubi Photography" on `prescottphotos.com`. Lockups for all three names stay in `brand/`.

## Photos

### Photos live in the repo and are processed at build time (2026-10-01, [#5](https://github.com/michaelrubi/prescott-photos/pull/5), [#13](https://github.com/michaelrubi/prescott-photos/pull/13), [#18](https://github.com/michaelrubi/prescott-photos/pull/18))

**Decision:** Full-quality JPGs (about 2560px on the long edge) go in `photos/<category>/` with a `photos.json` per folder for alt text, display order and options. At build time `@sveltejs/enhanced-img` makes AVIF and WebP at several widths and strips metadata (including GPS), `exifr` reads capture data for captions, and `sharp` + `thumbhash` make a tiny blur placeholder. PhotoSwipe is the full-screen viewer and loads only when opened.

**Why:** No CMS or image service to pay for or log in to; adding a photo is a file drop and a pull request with a preview link. Build-time processing gives modern formats and stripped GPS without Michael doing anything in Lightroom.

**Rejected:** A headless CMS or a hosted image CDN (cost and another account for a portfolio that changes a few times a year).

**Later additions:** A `capture` key for exports whose EXIF was stripped, `hero` and `focus` keys, and `photos/about/` for Michael's own photo, which never appears in the portfolio. A category folder with no photos is hidden from the filter (there are no family photos yet).

## SEO, copy and content

### SEO, copy and content in code (2026-10-01, [#9](https://github.com/michaelrubi/prescott-photos/pull/9))

**Decision:** Copy that repeats or changes often (packages, prices, retainer, policies, FAQs, locations) lives in `src/lib/content.ts`. Every page sets its own title, description, canonical URL and 1200×630 share image through `Seo.svelte`, with JSON-LD from `src/lib/schema.ts`. `sitemap.xml` is prerendered. The old site's `/portfolio`, `/pricing` and `/contact` 301-redirect in `firebase.json`.

**Why:** Fixes the old site's identical titles and missing metadata, and keeps prices in one place so the Sessions page, the FAQ and the payment amounts can't drift apart.

## Booking, proofing and payments

### Booking form posts straight to n8n (2026-10-01, [#10](https://github.com/michaelrubi/prescott-photos/pull/10), [#11](https://github.com/michaelrubi/prescott-photos/pull/11), [#12](https://github.com/michaelrubi/prescott-photos/pull/12))

**Decision:** The Book page posts each inquiry from the browser to an n8n webhook (`inquiryWebhook` in `src/lib/site.ts`). The n8n workflow saves it to a "Photo Bookings" data table, emails Michael, sends the client an auto-reply, and alerts on errors through Telegram.

**Why:** #9 first shipped a Firebase Cloud Function that emailed through Resend, but that needed the Blaze plan and a Resend account. Michael already self-hosts n8n, so the function was removed a few minutes after it merged.

**Details:** The form sends `application/x-www-form-urlencoded` with no custom headers. A JSON body triggers a CORS preflight that the webhook didn't answer, so every submission failed (#11). Free-text dates were replaced with up to three date pickers plus a time of day (#12) so n8n gets ISO dates it doesn't have to parse.

**Rejected:** Cloud Function + Resend (Blaze plan, extra account), a third-party form service. **Deferred:** a live availability calendar.

### Proofing galleries on Firestore (2026-10-01, [#14](https://github.com/michaelrubi/prescott-photos/pull/14), [#15](https://github.com/michaelrubi/prescott-photos/pull/15))

**Decision:** Clients pick their own favorites from a culled session at `/g#<gallery id>`. Michael manages galleries at `/g/admin` with Google sign-in. Proof images are resized in the browser (1600px proof, 640px thumbnail, metadata removed) and stored as bytes in Firestore documents. Sending picks notifies Michael through an n8n workflow.

**Why:**

- **Bytes in Firestore instead of Cloud Storage:** Storage needs Blaze. The free 1 GB of Firestore holds roughly 30 galleries of 80 photos, which is enough if galleries are deleted after delivery.
- **The id in the URL hash (`/g#id`) instead of a path:** the root layout's server `load` breaks SPA fallback routes on static hosting, and a hash never reaches a server log. The 20-character random id is the access key; nobody can list galleries.
- **Admins listed in `firestore.rules`:** a short fixed list of Google accounts, no user management to build.
- **Firebase config from Hosting's `/__/firebase/init.json`:** nothing to commit or keep in sync.
- **Separate Firebase app instances for gallery and admin:** a shared multi-tab cache otherwise stalled the client's signed-out writes when both were open.

**Defaults picked:** hearts only (no ratings), a hard cap at the package's image count unless the gallery has a per-extra price, no watermark.

**Rejected:** Cloud Storage for the proofs (Blaze).

### Card payments with Stripe Checkout through n8n (2026-10-01, [#16](https://github.com/michaelrubi/prescott-photos/pull/16))

**Decision:** `/pay` takes the retainer, the balance, or the full package price, and a proofing gallery takes payment for extra images. Both open Stripe Checkout. The n8n "Stripe checkout" workflow holds the Stripe secret key and works out every amount itself; the browser only says what is being paid for.

**Why:**

- **n8n holds the key:** the site has no server, and a secret key can't ship to the browser.
- **Amounts computed in n8n, never trusted from the browser:** package prices come from the prerendered `/pay/prices.json` (built from `content.ts`, so the page and the charge always agree), and extras from the gallery and picks in Firestore.
- **Stripe is the ledger:** the balance is the package price minus what Stripe already received from that email for that package, and extras subtract what was already paid for that gallery. Michael chose this over tracking payments in Firestore, so there's no second record to keep in sync. The trade-off is that a client must use the same email each time.
- **Retainer after the date is agreed,** not at inquiry, so nobody pays before Michael confirms availability.
- **Return URLs limited to this site's origins** so the checkout can't be used to redirect elsewhere.

**Rejected:** Storing payment records in Firestore. Selling prints through Stripe: prints stay in the Pixieset store.

**Status:** Stripe is in test mode. Going live means putting the live secret key in the n8n "Stripe" credential; nothing in the site changes.

### Final photo delivery: not decided (2026-10-01)

**Recommendation:** Pixieset Basic (about $8/month billed yearly). Clients get full-resolution downloads and can order prints from the same gallery, and the commission on print sales goes away. The free Pixieset plan caps client downloads at 2048px, so it can't deliver finals.

**Alternatives considered:** a Google Drive link (free, plain, no prints); Firebase Storage (likely free at this volume but needs Blaze and a custom upload and unlock flow); Cloudflare R2 (free egress, but needs n8n link signing and a large-file upload page). Building either storage option would save about $96 a year and add a delivery system to maintain.

**Status:** Waiting on Michael's choice. Nothing in the site depends on it yet.

## Open questions and unconfirmed content

These are live on the site but were written as drafts and haven't been confirmed by Michael in the project as of this writing:

- **Prices and packages** in `src/lib/content.ts`: Essential $250 (10 images), Signature $450 (25), Full Story $650 (40+), and the $100 retainer.
- **Policies:** one free reschedule with 48 hours' notice, retainer forfeited on cancellation, delivery in two weeks (one week for Full Story), galleries kept for 90 days, replies within two business days.
- **Terms and Privacy pages:** written from scratch because the old legal pages couldn't be read; not reviewed by a lawyer.
- **Prescott location list and the single testimonial.**

Still to decide or do:

- Switch live deploys to deploy-on-merge.
- Swap Stripe to the live key.
- Choose a photo delivery service (above).
- Add family photos (the Families filter stays hidden until there are some) and more testimonials.
