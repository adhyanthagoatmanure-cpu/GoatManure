# ADHYANTHA Goat Manure — E-Commerce Platform

A production-architected e-commerce platform for ADHYANTHA's organic goat manure and
natural fertilizer business: full storefront, cart/checkout, guest + account
authentication (email/password, Google, Facebook), coupons, order tracking, and a
separate admin console for products, orders, coupons, customers, blog, and testimonials.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5.26 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, self-hosted fonts (Fraunces + Karla via `@fontsource`) |
| Database | MySQL |
| ORM | Prisma 6.12.0 |
| Auth | Auth.js / NextAuth v5 beta (Credentials + Google + Facebook + WhatsApp OTP), bcrypt password hashing |
| Validation | Zod (shared between client forms and API routes) |
| Payments | PayU India Hosted Checkout with server-side SHA-512 verification |
| Forms | react-hook-form + @hookform/resolvers |

## What works right now, with zero configuration

- Full storefront: home, products, product details, cart, checkout, order success,
  order tracking, benefits, testimonials, blog, contact
- Guest checkout **and** account checkout
- Email/password login and forgot/reset password
- Cash on Delivery — the entire order flow end-to-end, including stock-safe order
  creation and coupon validation
- The `ADYA50` flat-₹50 coupon (and the coupon system generally — admin can create more)
- Full admin console: dashboard stats, product/variant management, order + shipment
  management, coupons, customers, blog, testimonials
- Role-protected admin area, ownership-checked customer account pages

## What needs your credentials before it's "live"

Nothing here is faked or stubbed silently — each of these is a real, working
integration that activates the moment you add real credentials to `.env`:

| Feature | Env vars | Behavior until set |
|---|---|---|
| Google login | `GOOGLE_CLIENT_ID/SECRET` | Button is hidden |
| Facebook login | `FACEBOOK_CLIENT_ID/SECRET` | Button is hidden |
| Online payment (PayU India) | `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_ENV` | Checkout reports that PayU is not configured; Cash on Delivery remains available |
| Transactional email (order confirmation, password reset) | `SMTP_*` | Emails are logged to the server console instead of sent |
| Admin order alerts (email + WhatsApp) | `ADMIN_NOTIFICATION_EMAIL`, `SMTP_*`, `WHATSAPP_*` | Order creation still succeeds; missing channels are logged to the server console |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | App won't start — see setup below |

See `.env.example` for the full list and where to get each credential.

## PayU India Hosted Checkout

The online checkout sends customers to PayU's hosted payment page. The merchant
salt and request hash stay on the server; payment intents are marked paid only
after the callback hash, transaction ID, and amount are verified.

Configure these server-side variables in local `.env` and in the production
hosting environment:

- `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` from the same PayU account
  environment.
- `PAYU_ENV="test"` with test credentials, or `PAYU_ENV="production"` with
  live credentials. `"live"` remains accepted as a compatibility alias.
- `NEXTAUTH_URL` set to the public site origin. PayU posts its success and
  failure response to `{NEXTAUTH_URL}/api/payment/payu/callback`; that endpoint
  must be publicly reachable over HTTPS in production. Production mode rejects
  localhost callback URLs because PayU cannot call a local development server.

Set these variables in the hosting provider's server-side environment settings
as well as local `.env`. Configure `PAYU_MERCHANT_KEY` and
`PAYU_MERCHANT_SALT` as secrets (not `NEXT_PUBLIC_*` variables), set
`PAYU_ENV` to `production`, and set `NEXTAUTH_URL` to the deployed HTTPS origin.
Redeploy or restart the application after changing environment variables so
the server process picks them up. No PayU credentials should be committed.

Apply the included Prisma migration before deploying:

```bash
npx prisma migrate deploy
npx prisma generate
```

Test a successful and failed payment with PayU test credentials before switching
`PAYU_ENV` and credentials to production. Never put the merchant salt in a
`NEXT_PUBLIC_*` variable or send it to the browser.

When configured, every successful order sends a detailed email to
`ADMIN_NOTIFICATION_EMAIL` and a WhatsApp alert through Meta's WhatsApp Cloud API
to `WHATSAPP_ADMIN_PHONE_NUMBER`. The WhatsApp number must be in E.164 format.
Order alerts use the approved `order_confirmation` and `new_order_admin` Utility
templates (language code `en`); the Meta App must have these templates active.

## WhatsApp OTP registration and login

Customer phone registration and login use a separate WhatsApp Authentication
template; the existing order Utility templates are never used for OTPs. Production
OTP delivery stays unavailable until the following **server-side** GoDaddy PaaS
settings are configured after the Authentication template has been approved:

- `WHATSAPP_OTP_TEMPLATE_NAME` — exact approved template name.
- `WHATSAPP_OTP_TEMPLATE_LANGUAGE` — exact approved language/locale code.
- `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` — the existing Cloud API
  token and sender phone-number ID.
- `WHATSAPP_API_VERSION` — optional; defaults to `v22.0`.
- `NEXTAUTH_SECRET` — also used to HMAC OTP codes, rate-limit identifiers, and
  one-time Auth.js login tickets.

The Authentication template must be active for the configured WhatsApp sender
and support the OTP text body plus the OTP URL button at index `0`, as required
by Meta's [authentication template send format](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/authentication-templates/).
The application cannot inspect or approve templates in Meta Business Manager.
Do not set the two template variables until the template, sender, and
`whatsapp_business_messaging` permission have been verified there. No credentials
are sent to the browser.

In development, the sender is a no-op mock: it makes no WhatsApp request and
does not log or return an OTP. Automated tests inject a mocked Cloud API response.
The development UI therefore cannot complete OTP registration or login without
a test-only fixture that provides a verification code.

The flow expires codes after five minutes, allows five verification attempts,
applies persisted per-phone and per-IP rate limits, and enforces a 60-second
resend cooldown. Codes and authentication tickets are stored only as keyed
hashes. A verified registration creates the user; login uses the existing
Auth.js Credentials/JWT session flow. Google and Facebook authentication remain
unchanged.

Apply the Prisma migration during deployment:

```bash
npx prisma migrate deploy
npx prisma generate
```

Existing `users.phone` values are not modified or marked verified by this
migration. A legacy customer can verify the unique phone value already on their
account during their first OTP login. If multiple legacy accounts have the same
phone, OTP login refuses the ambiguous match; review and resolve those records
manually rather than merging accounts automatically. Updating a profile phone
does not mark it verified.

## Persistent image uploads (GoDaddy PaaS)

Runtime uploads must not be written into the Git checkout or Next.js `public/`
directory: those files are not guaranteed to survive a PaaS restart or a
GitHub-based redeployment. Product, blog, and profile image bytes are stored in
the GoDaddy MySQL database in the `stored_images` table. The application serves
them through same-origin `/api/storage/...` URLs; image contents are not
exposed as database credentials or public filesystem paths.

Apply the new Prisma migration before deploying the application:

```bash
npm run db:deploy
```

This creates the `stored_images` table. GoDaddy's MySQL account must allow table
creation and have enough database storage for uploaded image files. Uploads
are limited to 5 MB per image; product forms can upload up to 10 images at
once.

Existing image URLs and database records remain unchanged. New uploads are
saved in MySQL and use stable `/api/storage/...` URLs. Legacy files can be
imported into MySQL after restoring them into their matching
`public/images/{products,blog,profiles}/uploads/` folders:


```bash
npm run storage:migrate-legacy -- --dry-run
```

Apply only after reviewing the output and ensuring the original files are
present:

```bash
npm run storage:migrate-legacy -- --apply
```

Missing source files are reported and their database references are retained;
the migration does not delete source files or substitute images.

Orphan cleanup is dry-run by default and prints candidate database image keys
without deleting:

```bash
npm run storage:cleanup
```

Review that report before explicitly deleting confirmed candidates:

```bash
npm run storage:cleanup -- --delete
```

Do not run deletion mode against production until its dry-run candidate list
has been reviewed.
WhatsApp delivery failures are logged and do not invalidate the order.

## WhatsApp Cloud API webhook

The public webhook endpoint is `/api/whatsapp/webhook`. It verifies Meta's GET
challenge using `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and accepts POST events only when
the `X-Hub-Signature-256` HMAC matches `WHATSAPP_APP_SECRET`. Both values must be
configured as server-side environment variables; do not prefix them with
`NEXT_PUBLIC_`. The app secret is available in Meta App Settings → Basic.

Set these variables in local `.env` and in the production hosting provider's
server-side environment settings:

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — generate a unique value with
  `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
- `WHATSAPP_APP_SECRET` — Meta App Secret, used only to validate webhook signatures.
- `WHATSAPP_API_VERSION` — Graph API version for the existing server-side sender.
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
  `WHATSAPP_BUSINESS_ACCOUNT_ID` — Meta Cloud API credentials/IDs.

`WHATSAPP_BUSINESS_ACCOUNT_ID` is documented for later use; outbound message
sending does not need to query the Graph API. No database migration is required:
webhook message and status events are safely summarized in server logs and are
not persisted or used to trigger business actions. Parsed events expose deterministic
`deduplicationKey` values (when upstream IDs/timestamps exist) for a future
persistent idempotency store. Message text is parsed for future processing, but
never logged. Sender/recipient identifiers are masked in logs.

For order template delivery, set `WHATSAPP_ACCESS_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_ADMIN_PHONE_NUMBER` on the server. The
admin/customer sends supply five body parameters in the approved template order;
the admin template's static header and footer are supplied by Meta and require no
dynamic header parameters. The customer template summarizes all order items in
its single product parameter and reports the total unit quantity.

For local testing, run `npm run dev`, then expose port 3000 using a trusted HTTPS
tunnel such as `cloudflared tunnel --url http://localhost:3000` or
`ngrok http 3000`. Use the temporary HTTPS URL only for development. Configure
Meta with the stable HTTPS domain from your production deployment:

```text
Callback URL: https://<your-production-domain>/api/whatsapp/webhook
Verify token: the exact WHATSAPP_WEBHOOK_VERIFY_TOKEN set in the server environment
```

In Meta Developer → WhatsApp → Configuration/Webhooks, enter the callback URL
and token, choose **Verify and save**, then subscribe to the **messages** field.
This field delivers incoming messages and message status updates. No other
webhook fields are needed for the current scope.

Quick verification checks (replace the token with the configured value):

```powershell
curl.exe -i "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=12345"
curl.exe -i "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345"
```

The valid request returns `200` and the challenge; the invalid token returns
`403`. POST requests must include a valid Meta signature. To check the route and
project after setup, run `npm run lint` and `npm run build`.

## Database setup

The application and all committed Prisma migrations use MySQL. Node.js 22 and
MySQL 8.0 or later are supported. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
and `DB_PASSWORD` in the runtime environment. Prisma Client, Prisma CLI commands,
and the production start script construct the MySQL connection URL from these
variables. A valid `DATABASE_URL` can be used as an override; when present, it
takes precedence over `DB_*`.
Next.js production builds do not require database credentials; configure the
database in the runtime environment before starting the deployed application.

For local development, copy `.env.example` to `.env`, set local database
credentials, and start the MySQL container:

```bash
docker compose up -d mysql
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

The compose file reads credentials from `.env`; it does not contain database
passwords. `MYSQL_ROOT_PASSWORD` is only needed for the local container.
Open http://localhost:3000. The admin console is at **/admin/login**.

Set `INITIAL_ADMIN_PASSWORD` (at least 12 characters) in `.env` before the
first seed, when it creates the admin account.
The development seed creates the admin `adhyanthagoatmanure@gmail.com`. To
create the optional demo customer `demo@adhyantha.com`, also set
`DEMO_CUSTOMER_PASSWORD` in `.env`. Do not reuse local seed passwords in
production.

### GoDaddy MySQL deployment

1. Create a MySQL database and database user in GoDaddy, and grant that user
   access to the database. GoDaddy may prefix the database and username; use
   their exact values below.
2. Add these server-side environment variables in the GoDaddy Node.js 22 app
   configuration. Keep the password private; do not commit it or place it in a
   `NEXT_PUBLIC_*` variable.

   ```text
   DB_HOST=<GoDaddy MySQL hostname>
   DB_PORT=<GoDaddy MySQL port, usually 3306>
   DB_NAME=<GoDaddy database name>
   DB_USER=<GoDaddy database user>
   DB_PASSWORD=<GoDaddy database password>
   ```

3. Install dependencies and generate the client, then apply only pending
   migrations:

   ```bash
   npm ci
   npx prisma generate
   npm run db:deploy
   npm run start
   ```

   `npm run start` also runs `prisma migrate deploy` before starting Next.js;
   applying the same committed migrations again is safe. `migrate deploy`
   does not reset or drop existing tables, and should be used instead of
   `migrate dev`, `db push`, or any reset command on production.

4. Production seeding is disabled unless explicitly enabled. Only after
   approving the production seed, set `ALLOW_PRODUCTION_SEED=true` and a strong
   `INITIAL_ADMIN_PASSWORD` in GoDaddy's private environment settings, run
   `npm run db:seed` once, then remove both settings. Production seeding does
   not create demo customer accounts or demo testimonials. The seed does not
   overwrite existing users or business data when run again. On later approved
   runs, the existing admin means `INITIAL_ADMIN_PASSWORD` is not needed.

Do not run migrations against an existing GoDaddy database until its data is
backed up and the current `_prisma_migrations` history has been checked. The
commands above were not run against GoDaddy or any production database.

## Design system

Colors, type, and spacing are derived from the actual logo and reference assets
supplied (extracted programmatically, not eyeballed) — see the CSS variables at the
top of `src/app/globals.css` for the full token list and rationale in the comments.

Product imagery is an original illustrated system (`public/images/products/*.svg`,
generated from `generate_product_images.py`) rather than stock photography — the ZIP
didn't include product photos, and this sandbox can't fetch external images. Swap
these for real photography any time by replacing the files at the same paths (or
updating `Product.images` in the database) — no component code changes needed.

The header logo (`public/images/brand/`) is the client's actual provided logo. Its
source PNG has an opaque cream background rather than transparency, which is fine on
the (also cream) header but shows a mismatched box on dark surfaces like the footer —
worth asking the client for a transparent PNG or SVG export if that matters for future
placements.

## Project structure

```
prisma/
  schema.prisma          Full data model (users, products, orders, coupons, etc.)
  migrations/             Ordered MySQL initial and incremental migrations
  seed.ts                 Demo data — products, ADYA50, admin user, demo content
prisma.config.js          Loads DB_* settings for Prisma CLI commands
src/
  app/                    Routes (App Router) — storefront, /account, /admin, /api
  components/
    ui/                   Design-system primitives (Button, Input, Card, ...)
    layout/                Header, Footer, mobile nav
    product/ cart/ checkout/ order/ auth/ account/ admin/ blog/ testimonial/ brand/
  server/
    services/              Business logic — pricing, coupons, orders (transactional)
    payment/                PayU Hosted Checkout + legacy Razorpay provider
    shipping/               ShippingProvider interface + manual implementation
    email/                  EmailService interface + SMTP/console implementations
  lib/                     prisma client, auth config, validation schemas, utils
  types/                   Shared TS types, status label/tone maps
```

Shipping and email are behind interfaces so providers can be changed without
touching order logic. The active online checkout uses PayU Hosted Checkout; the
Razorpay provider remains only for its legacy API routes.

## Honest scope notes

This is a genuinely large brief — the kind of scope a small team would spend several
weeks on. Priority was given to a correct, coherent, end-to-end system over
superficially covering every line item. A few things worth knowing:

- **Shipping fee** is a flat ₹49 / free-above-₹499 policy (`src/lib/config.ts`) — the
  brief didn't specify one, so this is a clearly-marked, easily-changed placeholder.
- **Shipment tracking** is manual (admin enters the courier + AWB number after booking
  on the courier's own dashboard) rather than live-integrated with a specific courier
  API — this was a deliberate architecture choice per the brief's own instruction not
  to hard-code one courier, and the interface is ready for that integration later.
- **Product photography** is illustrated, not photographed, for the reasons above.
- **Contact page details** (address, phone, hours) are explicitly marked as
  placeholders in the UI, per the brief's own instruction not to invent real business
  information.

## Next steps for a real launch

1. Add real credentials (§ above) for OAuth, PayU, and SMTP
2. Replace placeholder product photography and contact details
3. Configure GoDaddy's MySQL `DB_*` environment variables and back up the database
4. Review the existing `_prisma_migrations` history, then apply pending MySQL migrations
5. Only seed production after approval, using a private `INITIAL_ADMIN_PASSWORD`
6. Deploy on a Node.js 22 host
