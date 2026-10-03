# Integrations

How the site talks to n8n, Firestore and Stripe, and the one-time setup each needs. For why it works this way, see [decisions.md](decisions.md).

The site has no server. Each integration is a browser request to one of the n8n webhooks set in `src/lib/site.ts`, or a direct Firestore read or write.

| Setting in `site.ts` | n8n workflow | Used by |
| --- | --- | --- |
| `inquiryWebhook` | Booking form (saves to the "Photo Bookings" data table, emails Michael and the client) | `/book` |
| `picksWebhook` | Gallery picks → email | `/g` when a client sends picks |
| `checkoutWebhook` | Stripe checkout | `/pay` and `/g` extras |

A fourth workflow, **Stripe payment → email**, is triggered by Stripe itself, not the site. All of them use the n8n Global Error Handler workflow, which sends a Telegram alert when a run fails.

All three webhooks receive `application/x-www-form-urlencoded` posts with no custom headers. That keeps them "simple" requests, so the browser skips the CORS preflight that a JSON body would trigger. In n8n each workflow must be **published** (the production `/webhook/` URL only works then), and the Webhook node must allow this site's origins under **Allowed Origins (CORS)** (or `*`) so the page can read the response.

## Booking form

Fields: `name`, `email`, `type`, `package`, `dates` (ISO `YYYY-MM-DD`, sorted, comma-separated, up to three), `time` (Sunrise, Morning, Golden hour or Any time), `source`, `message`, `page`, `sentAt`. Any `2xx` response counts as sent.

## Proofing galleries

- **Client:** `/g#<gallery id>`. They heart photos (a counter tracks their package's image count), open any photo full screen (P picks it there), and send their picks with an optional note. Picks save as they go, so they can come back on another device. Sending locks the picks until Michael reopens them.
- **Admin:** `/g/admin`, signed in with Google. Create a gallery (title, client name, images included, optional per-image price for extras, a note), drop in the culled exports, copy the link. Picks appear live, with buttons to copy the file names for Lightroom's filename filter.

Everything runs in the browser against Firestore (`src/lib/proofing/`). Uploads are resized in the browser to a 1600px proof and a 640px thumbnail, with all metadata removed, and stored as bytes in Firestore documents. The free plan's 1 GB of Firestore storage holds roughly 30 galleries of 80 photos, so delete galleries after delivery.

The gallery id (20 random characters, in the URL hash so it never reaches a server log) is the key: anyone with the link can view and pick. Nobody can list galleries, and only the Google accounts listed in `firestore.rules` can create or change them. `/g` and `/g/admin` are served with `X-Robots-Tag: noindex`.

When a client sends picks, the page posts them to `picksWebhook` (if set). Fields: `gallery`, `client`, `count`, `included`, `extras`, `extraTotal`, `note`, `files` (Lightroom list), `admin` (link to the gallery's admin page), `sentAt`.

### One-time Firebase setup

Already done for `rubi-photo`; listed here in case the project is ever recreated.

1. **Firestore:** Firebase console → Build → Firestore Database → Create database. Use the `(default)` database, Standard edition, a US location (`us-west2` is closest; it can't be changed later), and production mode.
2. **Google sign-in:** Build → Authentication → Get started → Sign-in method → Google → Enable. Under Settings → Authorized domains, add `prescottphoto.com` and `prescottphotos.com` (and the staging channel's domain to test there).
3. **Web app:** Project settings → General → Your apps → Add app → Web, and link it to the Hosting site. The site reads its config from Hosting's `/__/firebase/init.json`, so nothing is pasted into the code.
4. **Rules and indexes:** `firebase deploy --only firestore` from this repo (needs the Firebase CLI signed in to the project). CI deploys Hosting only, so **redeploy the rules by hand whenever `firestore.rules` changes**, for example when adding an admin account.

### Local development

`pnpm dev:proofing` runs the site against local Firestore and Auth emulators (needs the Firebase CLI and Java 21+); the admin's sign-in button signs in as the studio account without Google. `pnpm test:rules` tests `firestore.rules` against the emulator. Plain `pnpm dev` uses the real project through the dev server's proxy.

## Payments

Clients pay by card through [Stripe Checkout](https://docs.stripe.com/payments/checkout). The n8n **Stripe checkout** workflow holds the Stripe secret key (in the n8n credential named "Stripe"). The browser only says what is being paid for; n8n works out the amount, creates a Checkout session and returns its URL (`src/lib/payments.ts`).

- **Retainer, balance or in full:** `/pay?package=<id>&for=retainer|balance|full`. Send a client `/pay?package=signature&for=retainer` once their date is set, `&for=balance` before delivery, or `&for=full` to pay it all at once. Package ids and prices come from `packages` and `retainer` in `src/lib/content.ts`, published as `/pay/prices.json` for n8n to read. The balance (and a full payment) is the package price less whatever Stripe already received from that email for that package, so a client who skipped the retainer pays the full price and nobody pays twice. Stripe's own payment records are the ledger, so the client must use the same email both times.
- **Extra images:** once a client sends more picks than their package includes, the gallery shows a "Pay by card" button for the extras. n8n counts the picks, reads the per-image price from Firestore, and subtracts anything Stripe already received for that gallery, so reopening a gallery and adding more only charges the difference.
- **Prints** stay in the Pixieset store, not Stripe.

The **Stripe payment → email** workflow emails Michael when a checkout completes. Stripe emails the client a receipt (in live mode: Stripe Dashboard → Settings → Customer emails → Successful payments).

Requests to `checkoutWebhook` carry `action` (`checkout` or `quote`), `kind` (`retainer`, `balance`, `full` or `extras`), `package` or `gallery`, optional `name` and `email`, and the `success` and `cancel` pages to return to (this site's origins only). `checkout` answers `{ url }`, or `{ total, paid, due }` when nothing is owed; `quote` answers `{ total, paid, due }` for a gallery's extras.

**Test vs live:** Stripe is in test mode. To take real payments, put the live secret key in the n8n "Stripe" credential. Nothing in the site changes.
